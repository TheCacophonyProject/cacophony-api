/// <reference path="../../support/index.d.ts" />

describe('Device names', () => {

  const camsGroup = "cams";
  const otherCams = "other cams";

  before(() => {
    cy.apiCreateUserGroupAndCamera("Anna", camsGroup, "gotya");
    cy.apiCreateGroup("Anna", otherCams, true);
  });

  it('group can have multiple devices with a different names', () => {
    cy.apiCreateCamera("Smile", camsGroup);
  });

  it('devices in different groups can have the same names', () => {
    cy.apiCreateCamera("gotya", otherCams);
  });

  it('But cannot create device with same name (even with different case) in the same group', () => {
    cy.apiShouldFailToCreateCamera("GotYa", camsGroup);
  });
});
