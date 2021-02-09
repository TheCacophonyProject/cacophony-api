/// <reference path="../../support/index.d.ts" />

describe('Device names', () => {

  const cams_group = "cams";
  const other_cams = "other cams";

  before(() => {
    cy.apiCreateUserGroupAndCamera("Anna", cams_group, "gotya");
    cy.apiCreateGroup("Anna", other_cams);
  });

  it('group can have multiple devices with a different names', () => {
    cy.apiCreateCamera("Smile", cams_group);
  });

  it('devices in different groups can have the same names', () => {
    cy.apiCreateCamera("gotya", other_cams);
  });

  it('But cannot create device with same name (even with different case) in the same group', () => {
    cy.apiShouldFailToCreateCamera("GotYa", cams_group);
  });
});
