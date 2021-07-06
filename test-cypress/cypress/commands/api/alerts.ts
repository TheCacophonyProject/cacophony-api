// load the global Cypress types
/// <reference types="cypress" />

import { getTestName } from "../names";
import {
  apiPath,
  getCreds,
  makeAuthorizedRequest,
  saveCreds,
  saveIdOnly,
  v1ApiPath
} from "../server";
import { logTestDescription, prettyLog } from "../descriptions";

Cypress.Commands.add("apiCreateAlert", (user, what, camera, alertName) => {
  logTestDescription(`Creating alert on '${what}' for camera '${camera}'`, {
    what: what,
    camera
  });
  const data = {
    name: alertName,
    conditions: JSON.stringify([{ tag: what, automatic: true }]),
    deviceId: getCreds(camera).id
  };

  cy.request({
    method: "POST",
    url: v1ApiPath("alerts"),
    body: data,
    headers: getCreds(user).headers
  });
});

Cypress.Commands.add(
  "checkAlerts",
  (user: string, camera: string, expectedEvents: ComparablePowerEvent) => {
    logTestDescription(
      `Check alert events for ${camera} is ${prettyLog(expectedEvents)}}`,
      {
        user,
        camera,
        expectedEvents
      }
    );

    checkAlerts(user, camera, expectedEvents);
  }
);

function checkAlerts(
  user: string,
  camera: string,
  expectedEvents: ComparableAlert[]
) {
  cy.apiGetEvents(user, camera, "alert").then((response) => {
    checkResponseMatches(response, expectedEvents);
  });
}

function checkResponseMatches(
  response: Cypress.Response,
  expectedEvents: ComparableAlert[]
) {
  expect(
    response.body.rows.length,
    `Expected ${expectedEvents.length} alerts`
  ).to.eq(expectedEvents.length);
  const alerts = response.body.rows;
  let index = 0;
  for (const alert of alerts) {
    const expectedEvent = expectedEvents[index];
    expect(
      alert.EventDetail.details.recId,
      `Alert should be for recording ${expectedEvent.recId}`
    ).to.eq(expectedEvent.recId);
    index++;
  }
}
