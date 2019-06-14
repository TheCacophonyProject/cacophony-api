'use strict';

module.exports = {
  up: async (queryInterface) => {
    queryInterface.removeConstraint("Devices","Devices_devicename_key");
    queryInterface.addConstraint('Devices', ['GroupId', 'devicename'], {
      type: 'unique',
      name: 'Devices_devicename_key'
    });
  },

  down: async (queryInterface) => {
    queryInterface.removeConstraint("Devices","Devices_devicename_key");
    queryInterface.addConstraint('Devices', ['devicename'], {
      type: 'unique',
      name: 'Devices_devicename_key'
    });
  }
};
