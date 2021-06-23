/// <reference path="../../support/index.d.ts" />

describe("Device names", () => {
  const camsGroup = "cams";
  const otherCams = "other cams";

  const KEEP_DEVICE_NAME = false;

  before(() => {
    cy.apiCreateUserGroupAndCamera("Anna", camsGroup, "gotya");
    cy.apiCreateGroup("Anna", otherCams, true);
  });

  it("group can have multiple devices with a different names", () => {
    cy.apiCreateCamera("Smile", camsGroup);
  });

  it("devices in different groups can have the same names", () => {
    cy.apiCreateCamera("gotya", otherCams);
  });

  it("But cannot create device with same name (even with different case) in the same group", () => {
    cy.apiShouldFailToCreateCamera("GotYa", camsGroup);
  });

  it("Should not be able to create a device name that doesn't have any letters", () => {
    cy.apiShouldFailToCreateCamera("12345", camsGroup, null, KEEP_DEVICE_NAME);
    cy.apiShouldFailToCreateCamera("123-34", camsGroup, null, KEEP_DEVICE_NAME);
  });

  it("Should be able to create a device name that has -, _, and spaces in it", () => {
    cy.apiCreateCamera("funny device1", camsGroup);
    cy.apiCreateCamera("funny-device2", camsGroup);
    cy.apiCreateCamera("funny_device3", camsGroup);
  });

  it("Shouldn't be able to create a device name that starts with -, _, and spaces in it", () => {
    cy.apiShouldFailToCreateCamera(
      " device1",
      camsGroup,
      null,
      KEEP_DEVICE_NAME
    );
    cy.apiShouldFailToCreateCamera(
      "-device2",
      camsGroup,
      null,
      KEEP_DEVICE_NAME
    );
    cy.apiShouldFailToCreateCamera(
      "_device3",
      camsGroup,
      null,
      KEEP_DEVICE_NAME
    );
  });

  it("Shouldn't be able to create a device with a bad salt ID", () => {
    cy.apiShouldFailToCreateCamera(
      "bad-salt-id",
      camsGroup,
      "a321",
      KEEP_DEVICE_NAME
    );
  });

  it("Should be able to create a device with a salt ID", () => {
    cy.apiCreateCamera("good-salt-id", camsGroup, "321");
  });
});
