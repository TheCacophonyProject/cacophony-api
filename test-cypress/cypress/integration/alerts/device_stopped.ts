/// <reference path="../../support/index.d.ts" />

describe("Device names", () => {
  const group = "stoppers";
  const user = "Jerry"
  before(() => {
    cy.apiCreateUserGroup(user, group);
  });

  it("Device stopped", () => {
    const camera = "Active"
    cy.apiCreateCamera(camera, group)
    cy.recordEvent(camera, "rpi-power-on",{},new Date())
    cy.checkStopped(user,camera, false);
  });
});
