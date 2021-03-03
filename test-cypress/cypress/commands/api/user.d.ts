// load the global Cypress types
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * create user and save api credentials further use
     */
    apiCreateUser(userName: string, log?: boolean): Chainable<Element>;

    /**
     * user sign in and stored with api credentials for further in the test
     */
    apiSignInAs(userName: string): Chainable<Element>;

    /**
     * create a group for the given user (who has already been referenced in the test
     */
    apiCreateGroup(
      userName: string,
      groupName: string,
      log?: boolean
    ): Chainable<Element>;

    /**
     * create user group and camera at the same time
     */
    apiCreateUserGroupAndCamera(
      userName: string,
      group: string,
      camera: string
    ): Chainable<Element>;

    /**
     * create user group and camera at the same time
     */
    apiCreateUserGroup(userName: string, group: string): Chainable<Element>;
  }
}
