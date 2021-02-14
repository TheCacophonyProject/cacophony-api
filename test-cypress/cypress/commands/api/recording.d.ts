// load the global Cypress types
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        // /**
        //  * use to test when a camera should not be able to be created. 
        // */
        // apiShouldFailToCreateCamera(cameraname: string, groupname: String): Chainable<Element>
    }
}
