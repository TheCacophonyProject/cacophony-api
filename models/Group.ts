/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Sequelize, {Op} from "sequelize";
import {ModelCommon, ModelStaticCommon} from "./index";
import {User} from "./User";
import {CreateStationData, Station, StationId} from "./Station";
import {Recording} from "./Recording";
import {latLngApproxDistance, MAX_STATION_DISTANCE_THRESHOLD_METERS} from "../api/V1/recordingUtil";
import {ClientError} from "../api/customErrors";

const { AuthorizationError } = require("../api/customErrors");
export type GroupId = number;

export interface Group extends Sequelize.Model, ModelCommon<Group> {
  id: GroupId;
  addUser: (userToAdd: User, through: any) => Promise<void>;
  addStation: (stationToAdd: CreateStationData) => Promise<void>;
  getUsers: (options: any) => Promise<User[]>;
  userPermissions: (
    user: User
  ) => Promise<{
    canAddUsers: boolean;
    canRemoveUsers: boolean;
    canAddStations: boolean;
  }>;

  getStations: () => Promise<Station[]>;
}
export interface GroupStatic extends ModelStaticCommon<Group> {
  addUserToGroup: (
    authUser: User,
    group: Group,
    userToAdd: User,
    admin: boolean
  ) => Promise<void>;
  removeUserFromGroup: (
    authUser: User,
    group: Group,
    userToRemove: User
  ) => Promise<void>;
  query: (where: any, user: User) => Promise<Group[]>;
  getFromId: (id: GroupId) => Promise<Group>;
  freeGroupname: (groupname: string) => Promise<boolean>;
  getIdFromName: (groupname: string) => Promise<GroupId | null>;

  addStationsToGroup: (
    authUser: User,
    group: Group,
    stationsToAdd: CreateStationData[],
    applyToRecordingsFromDate: Date | undefined
  ) => Promise<StationId[]>;
}

export default function (sequelize, DataTypes): GroupStatic {
  const name = "Group";

  const attributes = {
    groupname: {
      type: DataTypes.STRING,
      unique: true
    }
  };

  const Group = (sequelize.define(name, attributes) as unknown) as GroupStatic;

  Group.apiSettableFields = [];

  //---------------
  // Class methods
  //---------------
  const models = sequelize.models;

  Group.addAssociations = function (models) {
    models.Group.hasMany(models.Device);
    models.Group.belongsToMany(models.User, { through: models.GroupUsers });
    models.Group.hasMany(models.Recording);
    models.Group.hasMany(models.Station);
  };

  /**
   * Adds a user to a Group, if the given user has permission to do so.
   * The user must be a group admin to do this.
   */
  Group.addUserToGroup = async function (authUser, group, userToAdd, admin) {
    if (!(await group.userPermissions(authUser)).canAddUsers) {
      throw new AuthorizationError(
        "User is not a group admin so cannot add users"
      );
    }

    // Get association if already there and update it.
    const groupUser = await models.GroupUsers.findOne({
      where: {
        GroupId: group.id,
        UserId: userToAdd.id
      }
    });
    if (groupUser != null) {
      groupUser.admin = admin; // Update admin value.
      await groupUser.save();
    }

    await group.addUser(userToAdd, { through: { admin: admin } });
  };

  /**
   * Removes a user from a Group, if the given user has permission to do so.
   * The user must be a group admin to do this.
   */
  Group.removeUserFromGroup = async function (authUser, group, userToRemove) {
    if (!(await group.userPermissions(authUser)).canRemoveUsers) {
      throw new AuthorizationError(
        "User is not a group admin so cannot remove users"
      );
    }

    // Get association if already there and update it.
    const groupUsers = await models.GroupUsers.findAll({
      where: {
        GroupId: group.id,
        UserId: userToRemove.id
      }
    });
    for (const groupUser of groupUsers) {
      await groupUser.destroy();
    }
  };

  /**
   * Add stations to a group.
   * This will update any changes to position of existing stations.
   * If there are existing stations that are not in the new set, those stations will be retired.
   * Any new stations will be added.
   *
   * If there is an `applyToRecordingFromDate` Date provided, recordings belonging to this group
   * will be matched against the new list of stations to see if they fall within the station radius.
   *
   * As designed, this will *always* be a bulk import operation of external data from trap.nz
   */
  Group.addStationsToGroup = async function (
    authUser,
    group,
    stationsToAdd,
    applyToRecordingsFromDate
  ) {
    if (!(await group.userPermissions(authUser)).canAddStations) {
      throw new AuthorizationError(
        "User doesn't belong to group and/or is not a group admin so cannot add stations"
      );
    }

    // Or maybe we should do all of this on the front-end, and show the list of
    // what will be changed there?

    // Enforce name uniqueness to group here:
    let existingStations: Station[] = await group.getStations();
    // Filter out retired stations.
    existingStations = existingStations.filter(station => station.retiredAt === null);

    const existingStationsByName: Record<string, Station> = {};
    const newStationsByName: Record<string, CreateStationData> = {};
    const stationOpsPromises = [];
    for (const station of stationsToAdd) {
      newStationsByName[station.name] = station;
    }

    // Make sure existing stations that are not in the current update are retired, and removed from
    // the list of existing stations that we are comparing with.
    const retirePromises = [];
    const numExisting = existingStations.length;
    for (let i = 0; i < numExisting; i++) {
      const station = existingStations.pop();
      if (!newStationsByName.hasOwnProperty(station.name)) {
        station.retiredAt = new Date();
        retirePromises.push(station.save());
      } else {
        existingStations.unshift(station);
      }
    }
    for (const station of existingStations) {
      existingStationsByName[station.name] = station;
    }

    // Make sure no two stations are too close to each other:
    const allStations = [...existingStations, ...stationsToAdd].map(s => {
      if (s.hasOwnProperty('lat')) {
        return {
          name: (s as CreateStationData).name,
          location: [(s as CreateStationData).lat, (s as CreateStationData).lng] as [number, number]
        };
      } else {
        return {
          name: (s as Station).name,
          location: (s as Station).location.coordinates
        }
      }
    });
    for (const a of allStations) {
      for (const b of allStations) {
        if (a !== b && a.name !== b.name) {
          if (latLngApproxDistance(a.location, b.location) < MAX_STATION_DISTANCE_THRESHOLD_METERS) {
            throw new ClientError("Stations too close together");
          }
        }
      }
    }

    // Add new stations, or update lat/lng if station with same name but different lat lng.
    const addedStations = [];
    for (const [name, station] of Object.entries(newStationsByName)) {
      if (!existingStationsByName.hasOwnProperty(name)) {
        const stationObj = new models.Station({
          name: station.name,
          location: [station.lat, station.lng]
        });
        addedStations.push(stationObj);
        stationOpsPromises.push(
            stationObj.save()
                .then(() => {
                  group.addStation(stationObj)
                })
        );
      } else {
        // Update lat/lng if it has changed but the name is the same
        const stationToUpdate = existingStationsByName[station.name];

        const EPSILON = 0.000000000001;
        // We need to compare these numbers with an epsilon value, otherwise we get floating-point precision issues.
        if (
            Math.abs(stationToUpdate.location.coordinates[0] - station.lat) < EPSILON ||
            Math.abs(stationToUpdate.location.coordinates[1] - station.lat) < EPSILON
        ) {
          // NOTE - Casting this as "any" because station.location has a special setter function
          (stationToUpdate as any).location = [station.lat, station.lng];
          addedStations.push(stationToUpdate);
          stationOpsPromises.push(stationToUpdate.save());
        } else if (applyToRecordingsFromDate) {
          addedStations.push(stationToUpdate);
        }
      }
    }

    if (!applyToRecordingsFromDate) {
      return await Promise.all([...stationOpsPromises, ...retirePromises]).then(() => addedStations.map(({id}) => id));
    } else {
      await Promise.all([...stationOpsPromises, ...retirePromises]);
      // Now addedStations are properly resolved with ids:
      // Now we can look for all recordings in the group back to startDate, and check if any of them
      // should be assigned to any of our stations.

      // Find matching recordings to apply stations to from `applyToRecordingsFromDate`

      // Get recordings for group starting at date:
      const builder = await new models.Recording.queryBuilder().init(
          authUser,
          {
            // Group id, and after date
            GroupId: group.id,
            createdAt: {
              [Op.gte]: applyToRecordingsFromDate.toISOString()
            }
          }
      );
      const recordingsFromStartDate: Recording[] = await models.Recording.findAll(builder.get());
      const recordingOpPromises = [];
      for (const recording of recordingsFromStartDate) {
        for (const station of addedStations) {
          // Find any matches for stations
          if (recording.isInStation(station)) {
            recordingOpPromises.push(recording.setStation(station));
            break;
          }
        }
      }
      return Promise.all(recordingOpPromises).then(() => addedStations.map(({id}) => id));
    }
  };

  /**
   * Return one or more groups matching the where condition. Only get groups
   * that the user belongs if user does not have global read/write permission.
   */
  Group.query = async function (where, user: User) {
    let userWhere = { id: user.id };
    if (user.hasGlobalRead()) {
      userWhere = null;
    }
    return await models.Group.findAll({
      where: where,
      attributes: ["id", "groupname"],
      include: [
        {
          model: models.User,
          // NOTE(jon): This adds GroupUsers to the group, which is currently required
          // by the groups admin view to add new users to groups.  As per
          // https://github.com/TheCacophonyProject/cacophony-api/issues/279
          // we'd like to split this out into separate requests probably.
          attributes: ["id", "username"],
          where: userWhere
        },
        {
          model: models.Device,
          // NOTE: It'd be nice not to pull in deviceIds to our return payload,
          //  but they're currently used for the "Your groups" section on the
          //  homepage, to query recordings for each device of each group the
          //  user belongs to, just to get back a count of new recordings in the
          //  past 24 hours.
          // TODO(jon): Remove this once we have updated the front-end to use
          //  QueryRecordingsCount for the devices home page.
          attributes: ["id", "devicename"]
        }
      ]
    }).then((groups) => {
      // TODO: Review the following with a mind to combining with the groups.findAll query to improve efficiency
      const augmentGroupData = new Promise((resolve, reject) => {
        try {
          const groupsPromises = groups.map((group) => {
            return models.User.findAll({
              attributes: ["username", "id"],
              include: [
                {
                  model: models.Group,
                  where: {
                    id: group.id
                  },
                  attributes: []
                }
              ]
            }).then(async (groupUsers) => {
              const setAdminPromises = groupUsers.map((groupUser) => {
                return models.GroupUsers.isAdmin(group.id, groupUser.id).then(
                  (value) => {
                    groupUser.setDataValue("isAdmin", value);
                  }
                );
              });

              await Promise.all(setAdminPromises);

              group.setDataValue("GroupUsers", groupUsers);
              return group;
            });
          });

          Promise.all(groupsPromises).then((data) => {
            resolve(data);
          });
        } catch (e) {
          reject(e);
        }
      });

      return augmentGroupData.then((groupData) => {
        return groupData;
      });
    });
  };

  Group.getFromId = async function (id) {
    return this.findByPk(id);
  };

  Group.getFromName = async function (name) {
    return this.findOne({ where: { groupname: name } });
  };

  Group.freeGroupname = async function (name) {
    const group = await this.findOne({ where: { groupname: name } });
    if (group != null) {
      throw new Error("groupname in use");
    }
    return true;
  };

  // NOTE: It doesn't seem that there are any consumers of this function right now.
  Group.getIdFromName = async function (name): Promise<GroupId | null> {
    const Group = this;
    const group = await Group.findOne({ where: { groupname: name } });
    if (group == null) {
      return null;
    } else {
      group.getDataValue("id");
    }
  };

  //------------------
  // Instance methods
  //------------------

  Group.prototype.userPermissions = async function (user) {
    if (user.hasGlobalWrite()) {
      return newUserPermissions(true);
    }
    return newUserPermissions(
      await models.GroupUsers.isAdmin(this.id, user.id)
    );
  };

  const newUserPermissions = function (enabled) {
    return {
      canAddUsers: enabled,
      canRemoveUsers: enabled,
      canAddStations: enabled
    };
  };

  return Group;
}
