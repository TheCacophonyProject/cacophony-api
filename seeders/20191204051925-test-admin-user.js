'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert('Users', [{
      username: 'admin_test',
      email: 'admin@email.com',
      password: '$2a$10$1//aJH6/g9duTPxFyqByZ.yHD0XYv2.d3748CkXR/1/V0mXLFTwM.',
      globalPermission: 'write',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
