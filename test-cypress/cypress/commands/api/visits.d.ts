// load the global Cypress types
/// <reference types="cypress" />


interface ComparableVisit {
  start?: Date;
  end?: Date;
  tag?: string;
  recordings?: number;
}


declare namespace Cypress {
  interface Chainable {
    /**
     * check the visits returned match the listed visits specified. Only the specified information will be checked.
     * 
     * Please note:  visits must be listed in order of oldest to newest start dates. 
     * 
     */
    checkVisits(
      user: string,
      camera: string,
      expectedVisits: ComparableVisit[] 
    ): Chainable<Element>;

    /**
     * check the visits returned match the listed visits specified. Only the specified information will be checked.
     * 
     * Please note:  visits must be listed in order of oldest to newest start dates. 
     * 
     */
    checkVisitTags(
      user: string,
      camera: string,
      expectedTags: string[] 
    ): Chainable<Element>;

  }
}
