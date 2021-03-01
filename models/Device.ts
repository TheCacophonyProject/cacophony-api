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

import { AuthorizationError, ClientError } from "../api/customErrors";
import bcrypt from "bcrypt";
import { format } from "util";
import Sequelize, { FindOptions } from "sequelize";
import { ModelCommon, ModelStaticCommon } from "./index";
import { User, UserId } from "./User";
import { Group, GroupStatic } from "./Group";
import { GroupUsersStatic } from "./GroupUsers";
import { DeviceUsersStatic } from "./DeviceUsers";
import { ScheduleId } from "./Schedule";
import { Event } from "./Event";

const Op = Sequelize.Op;
export type DeviceId = number;
type UserDevicePermissions = {
  canListUsers: boolean;
  canAddUsers: boolean;
  canRemoveUsers: boolean;
};
export interface Device extends Sequelize.Model, ModelCommon<Device> {
  id: DeviceId;
  userPermissions: (user: User) => UserDevicePermissions;
  addUser: (userId: UserId, options: any) => any;
  devicename: string;
  groupname: string;
  password?: string;
  comparePassword: (password: string) => Promise<boolean>;
  reregister: (
    devicename: string,
    group: Group,
    newPassword: string
  ) => Promise<Device>;

  getEvents: (options: FindOptions) => Promise<Event[]>;
}

export interface DeviceStatic extends ModelStaticCommon<Device> {
  addUserToDevice: (
    authUser: User,
    device: Device,
    userToAdd: User,
    admin: boolean
  ) => Promise<boolean>;
  allForUser: (user: User, onlyActive: boolean) => Promise<{ rows: Device[]; count: number }>;
  removeUserFromDevice: (
    authUser: User,
    device: Device,
    user: User
  ) => Promise<boolean>;
  onlyUsersDevicesMatching: (
    user?: User,
    conditions?: any,
    ScheduleId?: ScheduleId,
    includeData?: any
  ) => Promise<{ rows: Device[]; count: number }>;
  freeDevicename: (name: string, id: number) => Promise<boolean>;
  newUserPermissions: (enabled: boolean) => UserDevicePermissions;
  getFromId: (id: DeviceId) => Promise<Device>;
  findDevice: (
    deviceID?: DeviceId,
    deviceName?: string,
    groupName?: string,
    password?: string
  ) => Promise<Device>;
  wherePasswordMatches: (
    devices: Device[],
    password: string
  ) => Promise<Device>;
  getFromNameAndPassword: (name: string, password: string) => Promise<Device>;
  allWithName: (name: string) => Promise<Device[]>;
  getFromNameAndGroup: (name: string, groupName: string) => Promise<Device>;
  queryDevices: (
    authUser: User,
    devices: Device[],
    groupNames: string[],
    operator: any
  ) => Promise<{ devices: Device[]; nameMatches: string }>;
  getCacophonyIndex: (
    authUser: User,
    deviceId: DeviceId,
    from: Date,
    windowSize: number
  ) => Promise<number>;
  getCacophonyIndexHistogram: (
    authUser: User,
    deviceId: DeviceId,
    from: Date,
    windowSize: number
  ) => Promise<{ hour: number; index: number }>;
}

export default function (
  sequelize: Sequelize.Sequelize,
  DataTypes
): DeviceStatic {
  const name = "Device";

  const attributes = {
    devicename: {
      type: DataTypes.STRING,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING
    },
    lastConnectionTime: {
      type: DataTypes.DATE
    },
    public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    currentConfig: {
      type: DataTypes.JSONB
    },
    newConfig: {
      type: DataTypes.JSONB
    },
    saltId: {
      type: DataTypes.INTEGER
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  };

  const options = {
    hooks: {
      afterValidate: afterValidate
    }
  };

  const Device = (sequelize.define(
    name,
    attributes,
    options
  ) as unknown) as DeviceStatic;

  //---------------
  // CLASS METHODS
  //---------------
  const models = sequelize.models;

  Device.addAssociations = function (models) {
    models.Device.hasMany(models.Recording);
    models.Device.hasMany(models.Event);
    models.Device.belongsToMany(models.User, { through: models.DeviceUsers });
    models.Device.belongsTo(models.Schedule);
    models.Device.belongsTo(models.Group);
    models.Device.hasMany(models.Alert);
  };

  /**
   * Adds/update a user to a Device, if the given user has permission to do so.
   * The authenticated user must either be admin of the group that the device
   * belongs to, an admin of that device, or have global write permission.
   */
  Device.addUserToDevice = async function (authUser, device, userToAdd, admin) {
    if (device == null || userToAdd == null) {
      return false;
    }
    if (!(await device.userPermissions(authUser)).canAddUsers) {
      throw new AuthorizationError(
        "User is not a group, device, or global admin so cannot add users to this device"
      );
    }

    // Get association if already there and update it.
    const deviceUser = await models.DeviceUsers.findOne({
      where: {
        DeviceId: device.id,
        UserId: userToAdd.id
      }
    });
    if (deviceUser != null) {
      deviceUser.admin = admin; // Update admin value.
      await deviceUser.save();
      return true;
    }

    await device.addUser(userToAdd.id, { through: { admin: admin } });
    return true;
  };

  /**
   * Removes a user from a Device, if the given user has permission to do so.
   * The user must be a group or device admin, or have global write permission to do this. .
   */
  Device.removeUserFromDevice = async function (
    authUser,
    device,
    userToRemove
  ) {
    if (device == null || userToRemove == null) {
      return false;
    }
    if (!(await device.userPermissions(authUser)).canRemoveUsers) {
      throw new AuthorizationError(
        "User is not a group, device, or global admin so cannot remove users from this device"
      );
    }

    // Check that association is there to delete.
    const deviceUsers = await models.DeviceUsers.findAll({
      where: {
        DeviceId: device.id,
        UserId: userToRemove.id
      }
    });
    for (const i in deviceUsers) {
      await deviceUsers[i].destroy();
    }
    return true;
  };

  Device.onlyUsersDevicesMatching = async function (
    user,
    conditions = null,
    includeData = null
  ) {
    // Return all devices if user has global write/read permission.
    if (user.hasGlobalRead()) {
      return this.findAndCountAll({
        where: conditions,
        attributes: ["devicename", "id", "GroupId", "active"],
        include: includeData,
        order: ["devicename"]
      });
    }

    const whereQuery = await addUserAccessQuery(user, conditions);

    return this.findAndCountAll({
      where: whereQuery,
      attributes: ["devicename", "id", "active"],
      order: ["devicename"],
      include: includeData
    });
  };

  Device.allForUser = async function (user, onlyActive: boolean) {
    const includeData = [
      {
        model: models.User,
        attributes: ["id", "username"]
      }
    ];
    const includeOnlyActiveDevices = onlyActive ? { active: true } : null;

    return this.onlyUsersDevicesMatching(user, includeOnlyActiveDevices, includeData);
  };

  Device.newUserPermissions = function (enabled) {
    return {
      canListUsers: enabled,
      canAddUsers: enabled,
      canRemoveUsers: enabled
    };
  };

  Device.freeDevicename = async function (devicename, groupId) {
    const device = await this.findOne({
      where: { devicename: devicename, GroupId: groupId }
    });
    if (device != null) {
      return false;
    }
    return true;
  };

  Device.getFromId = async function (id) {
    return this.findByPk(id);
  };

  Device.findDevice = async function (
    deviceID,
    deviceName,
    groupName,
    password
  ) {
    // attempts to find a unique device by groupname, then deviceid (devicename if int),
    // then devicename, finally password
    let model = null;
    if (deviceID && deviceID > 0) {
      model = this.findByPk(deviceID);
    } else if (groupName) {
      model = await this.getFromNameAndGroup(deviceName, groupName);
    } else {
      const models = await this.allWithName(deviceName);
      //check for devicename being id
      deviceID = parseExactInt(deviceName);
      if (deviceID) {
        model = this.findByPk(deviceID);
      }

      //check for distinct name
      if (model == null) {
        if (models.length == 1) {
          model = models[0];
        }
      }

      //check for device match from password
      if (model == null && password) {
        model = await this.wherePasswordMatches(models, password);
      }
    }
    return model;
  };

  Device.wherePasswordMatches = async function (devices, password) {
    // checks if there is a unique devicename and password match, else returns null
    const validDevices = [];
    let passwordMatch = false;
    for (let i = 0; i < devices.length; i++) {
      passwordMatch = await devices[i].comparePassword(password);
      if (passwordMatch) {
        validDevices.push(devices[i]);
      }
    }
    if (validDevices.length == 1) {
      return validDevices[0];
    } else {
      if (validDevices.length > 1) {
        throw new Error(
          format("Multiple devices match %s and supplied password", name)
        );
      }
      return null;
    }
  };

  Device.getFromNameAndPassword = async function (name, password) {
    const devices = await this.allWithName(name);
    return this.wherePasswordMatches(devices, password);
  };

  Device.allWithName = async function (name) {
    return this.findAll({ where: { devicename: name } });
  };

  Device.getFromNameAndGroup = async function (name, groupName) {
    return this.findOne({
      where: { devicename: name },
      include: [
        {
          model: models.Group,
          where: { groupname: groupName }
        }
      ]
    });
  };

  Device.getCacophonyIndex = async function (
    authUser,
    deviceId,
    from,
    windowSizeInHours
  ) {
    windowSizeInHours = Math.abs(windowSizeInHours);
    const windowEndTimestampUtc = Math.ceil(from.getTime() / 1000);
    // Make sure the user can see the device:
    await authUser.checkUserControlsDevices([deviceId]);

    // FIXME(jon): So the problem is that we're inserting recordings into the databases without
    //  saying how to interpret the timestamps, so they are interpreted as being NZ time when they come in.
    //  This happens to work when both the inserter and the DB are in the same timezone, but otherwise will
    //  lead to spurious values.  Need to standardize input time.

    const [
      result,
      _extra
    ] = await sequelize.query(`select round((avg(cacophony_index.scores))::numeric, 2) as cacophony_index from
(select
	(jsonb_array_elements("additionalMetadata"->'analysis'->'cacophony_index')->>'index_percent')::float as scores
from
	"Recordings"
where
	"DeviceId" = ${deviceId}
	and "type" = 'audio'
	and "recordingDateTime" at time zone 'UTC' between (to_timestamp(${windowEndTimestampUtc}) at time zone 'UTC' - interval '${windowSizeInHours} hours') and to_timestamp(${windowEndTimestampUtc}) at time zone 'UTC') as cacophony_index;`);
    const index = result[0].cacophony_index;
    if (index !== null) {
      return Number(index);
    }
    return index;
  };

  Device.getCacophonyIndexHistogram = async function (
    authUser,
    deviceId,
    from,
    windowSizeInHours
  ) {
    windowSizeInHours = Math.abs(windowSizeInHours);
    // We need to take the time down to the previous hour, so remove 1 second
    const windowEndTimestampUtc = Math.ceil(from.getTime() / 1000);
    // Make sure the user can see the device:
    await authUser.checkUserControlsDevices([deviceId]);
    // Get a spread of 24 results with each result falling into an hour bucket.
    const [results, extra] = await sequelize.query(`select
	hour,
	round((avg(scores))::numeric, 2) as index
from
(select
	date_part('hour', "recordingDateTime") as hour,
	(jsonb_array_elements("additionalMetadata"->'analysis'->'cacophony_index')->>'index_percent')::float as scores
from
	"Recordings"
where
	"DeviceId" = ${deviceId}
	and "type" = 'audio'
	and "recordingDateTime" at time zone 'UTC' between (to_timestamp(${windowEndTimestampUtc}) at time zone 'UTC' - interval '${windowSizeInHours} hours') and to_timestamp(${windowEndTimestampUtc}) at time zone 'UTC'
) as cacophony_index
group by hour
order by hour;
`);
    // TODO(jon): Do we want to validate that there is enough data in a given hour
    //  to get a reasonable index histogram?
    return results.map((item) => ({
      hour: Number(item.hour),
      index: Number(item.index)
    }));
  };

  /**
   * finds devices that match device array and groups array with supplied operator (or by default)
   */
  Device.queryDevices = async function (
    authUser,
    devices,
    groupNames,
    operator
  ) {
    let whereQuery;
    let nameMatches;
    if (!operator) {
      operator = Op.or;
    }

    if (devices) {
      const fullNames = devices.filter((device) => {
        return device.devicename.length > 0 && device.groupname.length > 0;
      });
      if (fullNames.length > 0) {
        const groupDevices = fullNames.map((device) =>
          [device.groupname, device.devicename].join(":")
        );
        whereQuery = Sequelize.where(
          Sequelize.fn(
            "concat",
            Sequelize.col("Group.groupname"),
            ":",
            Sequelize.col("devicename")
          ),
          { [Op.in]: groupDevices }
        );
      }

      const deviceNames = devices.filter((device) => {
        return device.devicename.length > 0 && device.groupname.length == 0;
      });
      if (deviceNames.length > 0) {
        const names = deviceNames.map((device) => device.devicename);
        let nameQuery = Sequelize.where(Sequelize.col("devicename"), {
          [Op.in]: names
        });
        nameQuery = await addUserAccessQuery(authUser, nameQuery);
        nameMatches = await this.findAll({
          where: nameQuery,
          include: [
            {
              model: models.Group,
              as: "Group",
              attributes: ["groupname"]
            }
          ],
          raw: true,
          attributes: ["Group.groupname", "devicename", "id", "saltId"]
        });
      }
    }

    if (groupNames) {
      const groupQuery = Sequelize.where(Sequelize.col("Group.groupname"), {
        [Op.in]: groupNames
      });
      if (devices) {
        whereQuery = { [operator]: [whereQuery, groupQuery] };
      } else {
        whereQuery = groupQuery;
      }
    }
    const matches: any = {};
    if (whereQuery) {
      whereQuery = await addUserAccessQuery(authUser, whereQuery);
      matches.devices = await this.findAll({
        where: whereQuery,
        include: [
          {
            model: models.Group,
            as: "Group",
            attributes: ["groupname"]
          }
        ],
        raw: true,
        attributes: ["Group.groupname", "devicename", "id", "saltId"]
      });
    }
    if (nameMatches) {
      matches.nameMatches = nameMatches;
    }
    return matches;
  };

  // Fields that are directly settable by the API.
  Device.apiSettableFields = ["location", "newConfig"];

  //------------------
  // INSTANCE METHODS
  //------------------

  Device.prototype.userPermissions = async function (user) {
    if (user.hasGlobalWrite()) {
      return Device.newUserPermissions(true);
    }

    const isGroupAdmin = await (models.GroupUsers as GroupUsersStatic).isAdmin(
      this.GroupId,
      user.id
    );
    const isDeviceAdmin = await (models.DeviceUsers as DeviceUsersStatic).isAdmin(
      this.id,
      user.id
    );
    return Device.newUserPermissions(isGroupAdmin || isDeviceAdmin);
  };

  Device.prototype.getJwtDataValues = function () {
    return {
      id: this.getDataValue("id"),
      _type: "device"
    };
  };

  Device.prototype.comparePassword = function (password) {
    const device = this;
    return new Promise(function (resolve, reject) {
      bcrypt.compare(password, device.password, function (err, isMatch) {
        if (err) {
          reject(err);
        } else {
          resolve(isMatch);
        }
      });
    });
  };

  // Returns users that have access to this device either via group
  // membership or direct assignment. By default, only "safe" user
  // attributes are returned.
  Device.prototype.users = async function (
    authUser,
    attrs = ["id", "username", "email"]
  ) {
    if (!(await this.userPermissions(authUser)).canListUsers) {
      return [];
    }

    const device_users = await this.getUsers({ attributes: attrs });
    const group: Group = await (models.Group as GroupStatic).getFromId(
      this.GroupId
    );

    const group_users = await group.getUsers({ attributes: attrs });

    return device_users.concat(group_users);
  };

  // Will register as a new device
  Device.prototype.reregister = async function (
    newName,
    newGroup,
    newPassword
  ) {
    let newDevice;
    await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
      },
      async (t) => {
        const conflictingDevice = await Device.findOne({
          where: {
            devicename: newName,
            GroupId: newGroup.id
          },
          transaction: t
        });

        if (conflictingDevice != null) {
          throw new ClientError(
            `already a device in group '${newGroup.groupname}' with the name '${newName}'`
          );
        }

        await Device.update(
          {
            active: false
          },
          {
            where: { saltId: this.saltId },
            transaction: t
          }
        );

        newDevice = await models.Device.create(
          {
            devicename: newName,
            GroupId: newGroup.id,
            password: newPassword,
            saltId: this.saltId
          },
          {
            transaction: t
          }
        );
      }
    );
    return newDevice;
  };

  return Device;
}

/**
*
filters the supplied query by devices and groups authUser is authorized to access
*/
async function addUserAccessQuery(authUser, whereQuery) {
  if (authUser.hasGlobalRead()) {
    return whereQuery;
  }
  const deviceIds = await authUser.getDeviceIds();
  const userGroupIds = await authUser.getGroupsIds();

  const accessQuery = {
    [Op.and]: [
      {
        [Op.or]: [
          { GroupId: { [Op.in]: userGroupIds } },
          { id: { [Op.in]: deviceIds } }
        ]
      },
      whereQuery
    ]
  };

  return accessQuery;
}

function parseExactInt(value) {
  const iValue = parseInt(value);
  if (value === iValue.toString()) {
    return Number(iValue);
  } else {
    return null;
  }
}

/********************/
/* Validation methods */
/********************/

function afterValidate(device: Device): Promise<void> | undefined {
  if (device.password !== undefined) {
    // TODO Make the password be hashed when the device password is set not in the validation.
    // TODO or make a custom validation for the password.
    return new Promise(function (resolve, reject) {
      bcrypt.hash(device.password, 10, function (err, hash) {
        if (err) {
          reject(err);
        } else {
          device.password = hash;
          resolve();
        }
      });
    });
  }
}
