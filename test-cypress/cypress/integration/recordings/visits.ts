/// <reference path="../../support/index.d.ts" />

import { times } from "cypress/types/lodash";
import { apiPath } from "../../commands/server";

describe('Device names', () => {

  const Dee = "Dee";
  const visitorCamera = "visitorG";

  before(() => {
    cy.apiCreateUserGroupAndCamera(Dee, "Dees Group", visitorCamera);
  });

  it('close time visits are grouped together', () => {
    let timeFirst = new Date(2021, 0, 20, 23, 0);
    let timeSecond = new Date(2021, 0, 20, 23, 9);
    cy.uploadRecording(visitorCamera, {time: timeFirst});
    cy.uploadRecording(visitorCamera, {time: timeSecond});
  });

  it('apart times are separate visits', () => {
    let timeFirst = new Date(2021, 0, 21, 23, 0);
    let timeSecond = new Date(2021, 0, 21, 23, 11);
    cy.uploadRecording(visitorCamera, {time: timeFirst});
    cy.uploadRecording(visitorCamera, {time: timeSecond});
  });
});
