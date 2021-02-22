// load the global Cypress types
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        /**
         * create a group for the given user (who has already been referenced in the test
        */
        apiCreateCamera(cameraName: string, group: string, log?: boolean): Chainable<Element>

        /**
         * use to test when a camera should not be able to be created. 
        */
        apiShouldFailToCreateCamera(cameraName: string, group: string): Chainable<Element>
    }
}
