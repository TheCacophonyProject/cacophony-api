// load the global Cypress types
/// <reference types="cypress" />
import { getTestName } from "../names";
import { v1ApiPath, getCreds, makeAuthorizedRequest } from "../server";
import { logTestDescription } from "../descriptions";

export const EventTypes = {
  POWERED_ON: "rpi-power-on",
  POWERED_OFF: "daytime-power-off",
  STOP_REPORTED: "stop-reported"
};

Cypress.Commands.add(
  "checkPowerEvents",
  (user: string, camera: string, expected: boolean, adminUsers = null) => {
    logTestDescription(
      `Check that ${camera} is ${
        expected ? "stopped" : "running"
      } with admin users ${adminUsers}`,
      {
        user,
        camera,
        expected,
        adminUsers
      }
    );

    checkEvents(user, camera, expected, adminUsers);
  }
);

function checkEvents(
  user: string,
  camera: string,
  stopped: boolean,
  adminUsers: string[] = null
) {
  const params = {
    deviceID: getCreds(camera).id
  };

  cy.request({
    method: "GET",
    url: v1ApiPath("events/powerEvents", params),
    headers: getCreds(user).headers
  }).then((response) => {
    checkResponseMatches(response, stopped, adminUsers);
  });
}

function checkResponseMatches(
  response: Cypress.Response,
  stopped: boolean,
  adminUsers: string[] = null
) {
  const powerEvents = response.body.events[0];
  expect(
    powerEvents.hasStopped,
    `Device should be ${stopped ? "stopped" : "running"}`
  ).to.eq(stopped);

  if (adminUsers != null) {
    const expectedUsers = adminUsers.map((user) => getTestName(user));
    const reportedUsers = powerEvents.AdminUsers.map((user) => user.username);
    expect(
      reportedUsers,
      `Device should have ${expectedUsers} as admin users but got
      ${reportedUsers}`
    ).to.include.members(expectedUsers);
    expect(
      reportedUsers,
      `Device should only have ${expectedUsers.length}( ${expectedUsers} ) as admin users but got
      ${reportedUsers.length}(${reportedUsers})`
    ).lengthOf(expectedUsers.length);
  }
}
