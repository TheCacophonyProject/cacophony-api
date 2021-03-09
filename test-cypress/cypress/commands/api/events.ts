// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, getCreds } from "../server";
import { logTestDescription } from "../descriptions";



Cypress.Commands.add(
  "checkStopped",
  (user: string, camera: string, expected: boolean) => {
    logTestDescription(`Check that ${camera} is reported as ${expected ? 'stopped' : 'running'}`, {
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
    deviceId:getCreds(camera).id
  };

  cy.request({
    method: "GET",
    url: v1ApiPath("events/stoppedDevices", params),
    headers: getCreds(user).headers
  }).then((response) => {
    checkResponseMatches(response, expected);
  });
}

function checkResponseMatches(
  response: Cypress.Response,
  expected: boolean
) {
  const responseVisits = response.body.rows;

  expect(
    responseVisits.length > 0,
    `Device should be reported as ${expected ? 'stopped' : 'running'}`
  ).to.eq(expected);
}
