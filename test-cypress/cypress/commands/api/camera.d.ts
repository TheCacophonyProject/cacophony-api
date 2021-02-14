// load the global Cypress types
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        /**
         * create a group for the given user (who has already been referenced in the test
        */
        apiCreateCamera(cameraname: string, groupname: String, log?: boolean): Chainable<Element>

        /**
         * use to test when a camera should not be able to be created. 
        */
        apiShouldFailToCreateCamera(cameraname: string, groupname: String): Chainable<Element>
    }
}
