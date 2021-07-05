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
  "apiCreateAlert",
  (user,what, camera, alertName) => {
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
      url: v1ApiPath("alerts"),
      body:data,
      headers: getCreds(user).headers
    });
  }
);

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
    const params = {
      deviceID: getCreds(camera).id
    };

    makeAuthorizedRequest(
      { url: v1ApiPath(`alerts/device/${getCreds(camera).id}`) },
      user
    ).then((response) => {
      checkResponseMatches(response, expectedEvents);
    });
  }

  function checkResponseMatches(
    response: Cypress.Response,
    expectedEvents: ComparableAlert[]
  ) {
    expect(response.body.Alerts.length, `Expected ${expectedEvents.length} alerts`).to.eq(expectedEvents.length);
    const alerts = response.body.Alerts;
    let index = 0;
    for(const alert of alerts){
      const expectedEvent = expectedEvents[index]
      expect(
        alert.name,
        `Alert should be for a ${expectedEvent.name}`
      ).to.eq(expectedEvent.name);
      expect(
        alert.recId,
        `Alert should be for recording ${
          expectedEvent.recId
        }`
      ).to.eq(expectedEvent.recId);
      index ++;

    }
  }
