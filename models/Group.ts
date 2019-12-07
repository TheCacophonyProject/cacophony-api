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

import Sequelize from "sequelize";
import { ModelCommon, ModelStaticCommon } from "./index";
import { User } from "./User";

const { AuthorizationError } = require("../api/customErrors");
export type GroupId = number;

export interface Group extends Sequelize.Model, ModelCommon<Group> {
  id: GroupId;
  addUser: (userToAdd: User, through: any) => Promise<void>;
  getUsers: (options: any) => Promise<User[]>;
  userPermissions: (
    user: User
  ) => Promise<{
    canAddUsers: boolean;
    canRemoveUsers: boolean;
  }>;
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
  getIdFromName: (groupname: string) => Promise<GroupId>;
}

export default function(sequelize, DataTypes): GroupStatic {
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

  Group.addAssociations = function(models) {
    models.Group.hasMany(models.Device);
    models.Group.belongsToMany(models.User, { through: models.GroupUsers });
    models.Group.hasMany(models.Recording);
  };

  /**
   * Adds a user to a Group, if the given user has permission to do so.
   * The user must be a group admin to do this.
   */
  Group.addUserToGroup = async function(authUser, group, userToAdd, admin) {
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
  Group.removeUserFromGroup = async function(authUser, group, userToRemove) {
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
   * Return one or more groups matching the where condition. Only get groups
   * that the user belongs if user does not have global read/write permission.
   */
  Group.query = async function(where, user: User) {
    let userWhere = { id: user.id };
    if (user.hasGlobalRead()) {
      userWhere = null;
    }
    return models.Group.findAll({
      where: where,
      attributes: ["id", "groupname"],
      include: [
        {
          model: models.User,
          attributes: [],
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
          attributes: ["id"]
        }
      ]
    });
  };

  Group.getFromId = async function(id) {
    return this.findByPk(id);
  };

  Group.getFromName = async function(name) {
    return this.findOne({ where: { groupname: name } });
  };

  Group.freeGroupname = async function(name) {
    const group = await this.findOne({ where: { groupname: name } });
    if (group != null) {
      throw new Error("groupname in use");
    }
    return true;
  };

  Group.getIdFromName = function(name) {
    const Group = this;
    return new Promise(function(resolve) {
      Group.findOne({ where: { groupname: name } }).then(function(group) {
        if (!group) {
          // FIXME(jon): Should this resolve false, or throw an error?
          //  At least reject the promise!
          resolve(false);
        } else {
          resolve(group.getDataValue("id"));
        }
      });
    });
  };

  //------------------
  // Instance methods
  //------------------

  Group.prototype.userPermissions = async function(user) {
    if (user.hasGlobalWrite()) {
      return newUserPermissions(true);
    }
    return newUserPermissions(
      await models.GroupUsers.isAdmin(this.id, user.id)
    );
  };

  const newUserPermissions = function(enabled) {
    return {
      canAddUsers: enabled,
      canRemoveUsers: enabled
    };
  };

  return Group;
}
