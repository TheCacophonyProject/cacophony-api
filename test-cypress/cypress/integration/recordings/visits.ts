/// <reference path="../../support/index.d.ts" />

import { apiPath } from "../../commands/server";

describe('Device names', () => {

  const Dee = "Dee";
  const visitorCamera = "visitor";

  before(() => {
    cy.apiCreateUserGroupAndCamera(Dee, "Dees Group", visitorCamera);
  });

  it('camera can have a visit', () => {
    cy.uploadRecording(visitorCamera);
  });
});
