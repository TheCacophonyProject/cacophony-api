const names = require("../names");

Cypress.Commands.add("apiCreateCamera", (cameraName, group) => {
  const devicesUrl = Cypress.config('cacophony-api-server') + '/api/v1/devices';
  const password = 'p' + names.getTestName(cameraName);

  const data = {
    devicename : names.getTestName(cameraName),
    password : password,
    group: names.getTestName(group),
  };

  cy.request('POST', devicesUrl, data);
});

