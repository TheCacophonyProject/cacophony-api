// load the global Cypress types
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
      /**
       * user sign in and stored with api credentials for further in the test
      */
     apiSignInAs(username: string): Chainable<Element>
    }
}
