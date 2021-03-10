// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, getCreds, makeAuthorizedRequest } from "../server";
import { logTestDescription } from "../descriptions";


export const EventTypes = {
	POWERED_ON: "rpi-power-on",
	POWERED_OFF: "daytime-power-off",
	STOP_REPORTED: "stop-reported",
}

Cypress.Commands.add(
  "checkStopped",
  (user: string, camera: string, expected: boolean) => {
    logTestDescription(`Check that ${camera} is ${expected ? 'stopped' : 'running'}`, {
      user,
      camera,
      expected
    });

    checkDeviceStopped(user, camera, expected);
  }
);

function checkDeviceStopped(
  user: string,
  camera: string,
  expected: boolean
) {
	const params = {
    deviceID:getCreds(camera).id
  };

  cy.request({
    method: "GET",
    url: v1ApiPath("events/powerEvents", params),
    headers: getCreds(user).headers
  }).then((response) => {
    checkResponseMatches(response, expected);
  });
}

function checkResponseMatches(
  response: Cypress.Response,
  expected: boolean
) {

  const powerEvents = response.body.rows[0];
  expect(
    powerEvents.hasStopped,
    `Device should be ${expected ? 'stopped' : 'running'}`
  ).to.eq(expected);
}
