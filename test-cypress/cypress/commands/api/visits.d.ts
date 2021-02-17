// load the global Cypress types
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
    
        /**
         * upload a single recording to for a particular camera
        */
        checkVisits(user: string, camera: string, noVists: number): Chainable<Element>
    }
}
    