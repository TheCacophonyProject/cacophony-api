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


Cypress.Commands.add(
  "apiCreateAlertForUser",
  (what, camera, alertName) => {
    logTestDescription(
      `Creating alert on '${what}' for camera '${camera}'`,
      {
        what: what,
        camera,      }
    );
    const data = {
      name: alertName,
      conditions: JSON.stringify([{tag:what, automatic:true}]),
      deviceId: getCreds(camera).id
    };

    cy.request({
      method: "POST",
      url: v1ApiPath("alerts", params),
      headers: getCreds(user).headers
    }).then((response) => {
      checkResponseMatches(response, expectedVisits);
    });
  }
);

  Cypress.Commands.add(
    "checkAlerts",
    (user: string, device: string, expectedEvent: ComparablePowerEvent) => {
      logTestDescription(
        `Check power events for ${camera} is ${prettyLog(expectedEvent)}}`,
        {
          user,
          camera,
          expectedEvent
        }
      );

      checkAlerts(user, camera, expectedEvent);
    }
  );


  function checkAlerts(
    user: string,
    camera: string,
    expectedAlerts: ComparableAlert[]
  ) {
    const params = {
      deviceID: getCreds(camera).id
    };

    makeAuthorizedRequest(
      { url: v1ApiPath(`alerts/device/${getCreds(camera).id}`) },
      user
    ).then((response) => {
      checkResponseMatches(response, expectedEvent);
    });
  }

  function checkResponseMatches(
    response: Cypress.Response,
    expectedEvents: ComparableAlert[]
  ) {
    expect(response.body.alerts.length, `Expected ${expectedEvent.length} alerts`).to.eq(expectedEvents.length);
    const alerts = response.body.alerts;
    let index = 0;
    for(const alert of alerts){
      const expectedEvent = expectedEvents[index]
      expect(
        alert.what,
        `Alert should be for ${expectedEvent.what}`
      ).to.eq(expectedEvent.what);
      expect(
        alert.recId,
        `Alert should be for recording ${
          expectedEvent.recId
        }`
      ).to.eq(expectedEvent.recId);
      index ++;

    }
  }
