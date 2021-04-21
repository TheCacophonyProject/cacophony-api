/// <reference path="../../support/index.d.ts" />

import { getTestName } from "../../commands/names";
import {
  makeAuthorizedRequest,
  checkAuthorizedRequestFails,
  v1ApiPath
} from "../../commands/server";
import { logTestDescription } from "../../commands/descriptions";

describe("Device authorization", () => {
  const admin = "George-group_admin";
  const member = "Germima-group_member";
  const device_member = "Gerry-device_member";
  const hacker = "Hacker";
  const group = "device_auth";
  const camera = "camera1";
  const NOT_ADMIN = false;

  before(() => {
    cy.apiCreateUser(member);
    cy.apiCreateUser(device_member);
    cy.apiCreateUser(hacker);
    cy.apiCreateUserGroupAndCamera(admin, group, camera);
    cy.apiAddUserToDevice(admin, device_member, camera);
    cy.apiAddUserToGroup(admin, member, group, NOT_ADMIN);
  });

  it("Admin group member should see everything", () => {
    checkDeviceRequestSucceeds(admin, true);
  });

  it("Group member should be able to read most things", () => {
    checkDeviceRequestSucceeds(member, NOT_ADMIN);
  });

  it("Device member should be able to read most things", () => {
    checkDeviceRequestSucceeds(device_member, NOT_ADMIN);
  });

  it("Hacker should not have any access", () => {
    logTestDescription(
      `Check that ${hacker} is blocked from getting device`,
      {}
    );
    checkAuthorizedRequestFails(deviceRequest(group, camera), hacker);
  });

  function checkDeviceRequestSucceeds(username: string, isAdmin: boolean) {
    logTestDescription(`Check that ${username} can get device`, {});
    makeAuthorizedRequest(deviceRequest(group, camera), username)
      .its("body.device")
      .should("have.nested.property", "id");

    logTestDescription(
      `Check that ${username} ${isAdmin ? "can" : "cannot"} see device users`,
      {}
    );
    if (isAdmin) {
      makeAuthorizedRequest(deviceRequest(group, camera), username)
        .its("body.device.users")
        .should("have.length", 1);
    } else {
      makeAuthorizedRequest(deviceRequest(group, camera), username)
        .its("body.device.users")
        .should("not.exist");
    }
  }
});

function deviceRequest(group: string, camera: string) {
  const groupName = getTestName(group);
  const deviceName = getTestName(camera);

  return {
    method: "GET",
    url: v1ApiPath(`devices/${deviceName}/in-group/${groupName}`)
  };
}
