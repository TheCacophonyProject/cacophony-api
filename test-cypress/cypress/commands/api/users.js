const url = require("url");
const names = require("../names");

Cypress.Commands.add("apiCreateUser", (username) => {
  const usersUrl = Cypress.config('cacophony-api-server') + '/api/v1/users';

  const fullName = names.getTestName(username);
  const password = 'p' + fullName;

  const data = {
    username : fullName,
    password : password,
    email: fullName + "@api.created.com"
  };

  cy.request('POST', usersUrl, data).then((response) => { saveUserInfo(response, username); });
});

Cypress.Commands.add("apiSignInAs", (username) => {
  const usersUrl = Cypress.config('cacophony-api-server') + '/authenticate_user';

  const fullName = names.getTestName(username);
  const password = 'p' + fullName;

  const data = {
    username : fullName,
    password : password,
  };

  cy.request('POST', usersUrl, data).then((response) => { saveUserInfo(response, username); });
});

Cypress.Commands.add("apiCheckUserCanSeeGroup", (username, groupname) => {
  const user = getUserInfo(username);
  const fullGroupname = names.getTestName(groupname);
  const fullUrl = Cypress.config('cacophony-api-server') + "/" + url.format({
    pathname: 'api/v1/groups',
    query: {
      'where': "{}"
    }
  });

  cy.request({
    url: fullUrl,
    headers: user.headers
  }).then((request) => {
    const allGroupNames = Object.keys(request.body.groups).map(key => request.body.groups[key].groupname);
    expect(allGroupNames).to.contain(fullGroupname);
  });
});

function getUserInfo(username) {
  return Cypress.config("apiClients")[username];
}

function getCameraInfo(cameraName) {
  return Cypress.config("devices")[cameraName];
}

function saveUserInfo(response, username)  {
  Cypress.config("apiClients")[username] = {
    jwt : response.body.token,
    username: username,
    headers: {
      'authorization': response.body.token
    }
  };
}

Cypress.Commands.add("apiCheckEventUploaded", (username, deviceName, eventType) => {
  const user = getUserInfo(username);
  const camera = getCameraInfo(deviceName);
  const eventURL = Cypress.config('cacophony-api-server') + '/api/v1/events?deviceId='+camera.id;
  cy.request({
    method: "GET",
    url: eventURL,
    headers: user.headers
  }).then((request) => {
    expect(request.body.rows[0].EventDetail.type).to.equal(eventType);
  });
});

Cypress.Commands.add("apiCheckDeviceHasRecording", (username, deviceName) => {
  const user = getUserInfo(username);
  const camera = getCameraInfo(deviceName);
  const fullUrl = Cypress.config('cacophony-api-server') + "/" + url.format({
    pathname: 'api/v1/recordings',
    query: {
      'where': "{\"DeviceId\":"+camera.id+"}"
    },
    headers: user.headers
  });

  cy.request({
    url: fullUrl,
    headers: user.headers
  }).then((request) => {
    expect(request.body.count).to.equal(1);
  });
});