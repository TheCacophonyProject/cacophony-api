/// <reference path="../../support/index.d.ts" />

import { times } from "cypress/types/lodash";
import { apiPath } from "../../commands/server";

describe('Device names', () => {

  const Dee = "Dee";
  const visitorCamera = "visitorH";

  before(() => {
    cy.apiCreateUserGroupAndCamera(Dee, "Dees Group", visitorCamera);
  });

  it('close time visits are grouped together', () => {
    cy.uploadRecording(visitorCamera, {});
    cy.uploadRecording(visitorCamera, {minsLater: 9});
    cy.checkVisits(Dee, 1);
  });

  it.only('apart times are separate visits', () => {
    cy.uploadRecording(visitorCamera, {});
    cy.uploadRecording(visitorCamera, {minsLater: 11});
    cy.checkVisits(Dee, 2);
  });
});
