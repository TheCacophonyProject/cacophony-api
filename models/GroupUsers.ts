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
import { GroupId } from "./Group";
import { UserId } from "./User";

export interface GroupUsers extends Sequelize.Model, ModelCommon<GroupUsers> {}
export interface GroupUsersStatic extends ModelStaticCommon<GroupUsers> {
  isAdmin: (groupId: GroupId, userId: UserId) => Promise<boolean>;
}

export default function (sequelize, DataTypes): GroupUsersStatic {
  const name = "GroupUsers";

  const attributes = {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  };

  const GroupUsers = (sequelize.define(
    name,
    attributes
  ) as unknown) as GroupUsersStatic;

  //---------------
  // CLASS METHODS
  //---------------

  /**
   * Checks if a user is a admin of a group.
   */
  GroupUsers.isAdmin = async function (groupId, userId) {
    const groupUsers = await this.findOne({
      where: {
        GroupId: groupId,
        UserId: userId,
        admin: true
      }
    });
    return groupUsers != null;
  };

  return GroupUsers;
}
