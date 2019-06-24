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

module.exports = function(sequelize, DataTypes) {
  const name = "DeviceUsers";

  const attributes = {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  };

  const DeviceUsers = sequelize.define(name, attributes);

  //---------------
  // CLASS METHODS
  //---------------

  DeviceUsers.addAssociations = function() {};

  DeviceUsers.isAdmin = async function(deviceId, userId) {
    const deviceUser = await this.findOne({
      where: {
        DeviceId: deviceId,
        UserId: userId,
        admin: true
      }
    });
    return deviceUser != null;
  };

  return DeviceUsers;
};
