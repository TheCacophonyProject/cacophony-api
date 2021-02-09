// load the global Cypress types
/// <reference types="cypress" />

import url = require("url");
import names = require("../names");
import { apiPath, getCreds, saveCreds } from "../server";

Cypress.Commands.add("apiCreateUser", (username) => {
  const usersUrl = apiPath() + '/api/v1/users';

  const fullName = names.getTestName(username);
  const password = 'p' + fullName;

  const data = {
    username : fullName,
    password : password,
    email: fullName + "@api.created.com"
  };

  cy.request('POST', usersUrl, data).then((response) => { saveCreds(response, username); });
});

Cypress.Commands.add("apiSignInAs", (username) => {
  const usersUrl = apiPath() + '/authenticate_user';

  const fullName = names.getTestName(username);
  const password = 'p' + fullName;

  const data = {
    username : fullName,
    password : password,
  };

  cy.request('POST', usersUrl, data).then((response) => { saveCreds(response, username); });
});

Cypress.Commands.add("apiCreateGroup", (username, groupname) => {
  const user = getCreds(username);
  const fullGroupname = names.getTestName(groupname);
  const groupURL = apiPath() + "/api/v1/groups";

  const data = {
    groupname : fullGroupname,
  };

  cy.request({
    method: 'POST', 
    url: groupURL, 
    headers: user.headers,
    body: data});
});

Cypress.Commands.add("apiCheckUserCanSeeGroup", (username, groupname) => {
  const user = getCreds(username);
  const fullGroupname = names.getTestName(groupname);
  const fullUrl = apiPath() + "/" + url.format({
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

Cypress.Commands.add("apiCreateUserGroupAndCamera", (username, group, camera) => {
  cy.apiCreateUser(username);
  cy.apiCreateGroup(username, group);
  cy.apiCreateCamera(camera, group);
});


// Cypress.Commands.add("apiCheckEventUploaded", (username, deviceName, eventType) => {
//   const user = getUserCreds(username);
//   const camera = getCameraInfo(deviceName);
//   const eventURL = apiPath() + '/api/v1/events?deviceId='+camera.id;
//   cy.request({
//     method: "GET",
//     url: eventURL,
//     headers: user.headers
//   }).then((request) => {
//     expect(request.body.rows[0].EventDetail.type).to.equal(eventType);
//   });
// });

// Cypress.Commands.add("apiCheckDeviceHasRecording", (username, deviceName) => {
//   const user = getUserInfo(username);
//   const camera = getCameraInfo(deviceName);
//   const fullUrl = apiPath() + "/" + url.format({
//     pathname: 'api/v1/recordings',
//     query: {
//       'where': "{\"DeviceId\":"+camera.id+"}"
//     },
//     headers: user.headers
//   });

//   cy.request({
//     url: fullUrl,
//     headers: user.headers
//   }).then((request) => {
//     expect(request.body.count).to.equal(1);
//   });
// });