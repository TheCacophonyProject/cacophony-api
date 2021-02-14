// load the global Cypress types
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        /**
         * create user and save api credentials further use
        */
        apiCreateUser(username: string, log: boolean): Chainable<Element>

        /**
         * user sign in and stored with api credentials for further in the test
        */
        apiSignInAs(username: string): Chainable<Element>

        /**
         * create a group for the given user (who has already been referenced in the test
        */
        apiCreateGroup(username: string, groupname: String, log: boolean): Chainable<Element>
 
        /**
         * create user group and camera at the same time
        */
        apiCreateUserGroupAndCamera(username: string, group: String, camera: String): Chainable<Element>
    }
}
