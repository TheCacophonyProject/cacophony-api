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

import bcrypt from "bcrypt";
import Sequelize, {
  BuildOptions,
  ModelAttributes,
  ModelCtor,
  ModelOptions
} from "sequelize";
import { AuthorizationError } from "../api/customErrors";
import log from "../logging";
import { bool } from "aws-sdk/clients/signer";
import Model from "sequelize";
import { ModelCommon, ModelStaticCommon } from "./index";
import { Group } from "../models/Group";

const Op = Sequelize.Op;

const PERMISSION_WRITE = "write";
const PERMISSION_READ = "read";
const PERMISSION_OFF = "off";
type GlobalPermission = "write" | "read" | "off";
const PERMISSIONS: readonly string[] = Object.freeze([
  PERMISSION_WRITE,
  PERMISSION_READ,
  PERMISSION_OFF
]);

export type UserId = number;

export interface User extends Sequelize.Model, ModelCommon<User> {
  getWhereDeviceVisible: () => Promise<null | { DeviceId: {} }>;
  getDataValues: () => Promise<UserData>;
  comparePassword: (password: string) => Promise<boolean>;
  getAllDeviceIds: () => Promise<number[]>;
  getGroupsIds: () => Promise<number[]>;
  getGroups: (options: { where: any, attributes: string[] }) => Promise<Group[]>;
  isInGroup: (groupId: number) => Promise<boolean>;
  isGroupAdmin: (groupId: number) => Promise<boolean>;
  checkUserControlsDevices: (deviceIds: number[]) => Promise<void>;
  canAccessDevice: (deviceId: number) => Promise<bool>;
  canAccessGroup: (groupId: number) => Promise<bool>;
  getDeviceIds: () => Promise<number>;
  admin: boolean;
  getGroupDeviceIds: () => Promise<number[]>;
  hasGlobalWrite: () => boolean;
  hasGlobalRead: () => boolean;
  id: UserId;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  groups: Group[];
  globalPermission: GlobalPermission;
}

export interface UserStatic extends ModelStaticCommon<User> {
  new (values?: object, options?: BuildOptions): User;
  getAll: (where: any) => Promise<User[]>;

  changeGlobalPermission: (
    admin: User,
    user: User,
    permission: GlobalPermission
  ) => Promise<User>;
  getFromName: (name: string) => Promise<User | null>;
  freeUsername: (name: string) => Promise<boolean>;
  getFromEmail: (email: string) => Promise<User | null>;
  freeEmail: (email: string) => Promise<boolean>;
  getFromId: (id: number) => Promise<User | null>;
  ["GLOBAL_PERMISSIONS"]: string[];
}

interface UserData {
  id: UserId;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  groups: Group[];
  globalPermission: GlobalPermission;
}

export default function (
  sequelize: Sequelize.Sequelize,
  DataTypes
): UserStatic {
  const name = "User";
  const attributes: ModelAttributes = {
    username: {
      type: DataTypes.STRING,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    globalPermission: {
      type: DataTypes.ENUM,
      values: PERMISSIONS as string[],
      defaultValue: PERMISSION_OFF
    },
    endUserAgreement: {
      type: DataTypes.INTEGER
    }
  };

  const options: ModelOptions = {
    hooks: {
      beforeValidate: beforeValidate,
      beforeCreate: beforeModify,
      beforeUpdate: beforeModify,

      // NOTE: Doesn't exist on publicly available typings, so ignore
      // @ts-ignore
      beforeUpsert: beforeModify
    }
  };

  // Define table
  const User = (sequelize.define(
    name,
    attributes,
    options
  ) as unknown) as UserStatic;

  User.publicFields = Object.freeze(["id", "username"]);

  User.apiSettableFields = Object.freeze([
    "firstName",
    "lastName",
    "email",
    "endUserAgreement"
  ]);

  Object.defineProperty(User, "GLOBAL_PERMISSIONS", {
    value: PERMISSIONS,
    writable: false
  });

  //---------------
  // CLASS METHODS
  //---------------
  const models = sequelize.models;

  User.addAssociations = function (models) {
    models.User.belongsToMany(models.Group, {
      through: models.GroupUsers
    });
    models.User.belongsToMany(models.Device, { through: models.DeviceUsers });
    models.User.hasMany(models.Alert);
  };

  User.getAll = async function (where) {
    return this.findAll({
      where,
      attributes: this.publicFields
    });
  };

  User.getFromId = async function (id) {
    return this.findByPk(id);
  };

  User.getFromName = async function (name: string) {
    return this.findOne({ where: { username: name } });
  };

  User.freeUsername = async function (username) {
    const user = await this.findOne({ where: { username: username } });
    if (user != null) {
      throw new Error("Username in use");
    }
    return true;
  };

  User.getFromEmail = async function (email) {
    return this.findOne({ where: { email: email } });
  };

  User.freeEmail = async function (email: string, userId?: UserId) {
    email = email.toLowerCase();
    const where: { email: string; id?: any } = { email };
    if (userId) {
      //Ignore email from this user
      where.id = { [Op.not]: userId };
    }
    const user = await this.findOne({ where });
    if (user) {
      throw new Error("Email in use");
    }
    return true;
  };

  User.changeGlobalPermission = async function (admin, user, permission) {
    if (!user || !admin || !admin.hasGlobalWrite()) {
      throw new AuthorizationError(
        "User must be an admin with global write permissions"
      );
    }
    user.globalPermission = permission;
    return user.save();
  };

  //------------------
  // INSTANCE METHODS
  //------------------

  User.prototype.hasGlobalWrite = function () {
    return PERMISSION_WRITE == this.globalPermission;
  };

  User.prototype.hasGlobalRead = function () {
    return [PERMISSION_WRITE, PERMISSION_READ].includes(this.globalPermission);
  };

  User.prototype.getGroupDeviceIds = async function () {
    const groupIds = await this.getGroupsIds();
    if (groupIds.length > 0) {
      const devices = await models.Device.findAll({
        where: { GroupId: { [Op.in]: groupIds } },
        attributes: ["id"]
      });
      return devices.map((d) => d.id);
    } else {
      return [];
    }
  };

  User.prototype.getWhereDeviceVisible = async function () {
    if (this.hasGlobalRead()) {
      return null;
    }

    const allDeviceIds = await this.getAllDeviceIds();
    return { DeviceId: { [Op.in]: allDeviceIds } };
  };

  User.prototype.getJwtDataValues = function () {
    return {
      id: this.getDataValue("id"),
      _type: "user"
    };
  };

  User.prototype.getDataValues = function () {
    const user = this;
    return new Promise(function (resolve) {
      user.getGroups().then(function (groups) {
        resolve({
          id: user.getDataValue("id"),
          username: user.getDataValue("username"),
          firstName: user.getDataValue("firstName"),
          lastName: user.getDataValue("lastName"),
          email: user.getDataValue("email"),
          groups: groups,
          globalPermission: user.getDataValue("globalPermission"),
          endUserAgreement: user.getDataValue("endUserAgreement")
        });
      });
    });
  };

  // Returns the groups that are associated with this user (via
  // GroupUsers).
  User.prototype.getGroupsIds = async function () {
    const groups = await this.getGroups();
    return groups.map((g) => g.id);
  };

  User.prototype.isInGroup = async function (
    groupId: number
  ): Promise<boolean> {
    const groupIds = await this.getGroupsIds();
    return groupIds.includes(groupId) === true;
  };

  User.prototype.isGroupAdmin = async function (
      groupId: number
  ): Promise<boolean> {
    const groupIds = await this.getGroups();
    return groupIds.some(({id, GroupUsers}) => id === groupId && GroupUsers.admin === true);
  };

  // Returns the devices that are directly associated with this user
  // (via DeviceUsers).
  User.prototype.getDeviceIds = async function () {
    const devices = await this.getDevices();
    return devices.map((d) => d.id);
  };

  User.prototype.canAccessDevice = async function (deviceId) {
    const deviceIds = await this.getDeviceIds();
    return deviceIds.includes(deviceId);
  };

  User.prototype.checkUserControlsDevices = async function (deviceIds) {
    if (!this.hasGlobalWrite()) {
      const usersDevices = await this.getAllDeviceIds();

      deviceIds.forEach((deviceId) => {
        if (!usersDevices.includes(deviceId)) {
          log.info(
            "Attempted unauthorized use of device " +
              deviceId +
              " by " +
              this.username
          );
          throw new AuthorizationError(
            "User is not authorized for one (or more) of specified devices."
          );
        }
      });
    }
  };

  User.prototype.getAllDeviceIds = async function () {
    const directDeviceIds = await this.getDeviceIds();
    const groupedDeviceIds = await this.getGroupDeviceIds();
    return [...directDeviceIds, ...groupedDeviceIds];
  };

  User.prototype.comparePassword = function (password: string) {
    const user = this;
    return new Promise(function (resolve, reject) {
      bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) {
          reject(err);
        } else {
          resolve(isMatch);
        }
      });
    });
  };

  return User;
}

//----------------------
// VALIDATION FUNCTIONS
//----------------------

async function beforeModify(user) {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
}

function beforeValidate(user): Promise<void> {
  return new Promise((resolve) => {
    user.setDataValue("email", user.getDataValue("email").toLowerCase());
    resolve();
  });
}
