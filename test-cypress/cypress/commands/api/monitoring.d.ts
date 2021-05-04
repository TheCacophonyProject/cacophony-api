// load the global Cypress types
/// <reference types="cypress" />

interface ComparableVisit {
  // either a date object or a string representing the time of day (enough for most tests)
  start?: Date | string;
  end?: Date | string;
  tag?: string;
  recordings?: number;
  incomplete? : string;  
  aiTag? : string;
  camera? : string;
  station? : string;
}

interface VisitSearchParams { 
  from?: Date | string;
  until?: Date | string;
  devices?: number | number[], 
  page?: number;
  "page-size"? : number;
  ai?: string;
  groups?: number | number[],
}


declare namespace Cypress {
  interface Chainable {
    /**
     * check the visits returned match the listed visits specified. Only the specified information will be checked.
     *
     * Please note:  visits must be listed in order of oldest to newest start dates.
     *
     */
    checkMonitoring(
      user: string,
      camera: string,
      expectedVisits: ComparableVisit[],
      log?: boolean
    );
    
    /**
     * check the visits returned match the listed visits specified. Only the specified information will be checked.
     *
     * Please note:  visits must be listed in order of oldest to newest start dates.
     *
     */
    checkMonitoringWithFilter(
      user: string,
      camera: string,
      searchParams: VisitSearchParams ,
      expectedVisits: ComparableVisit[]
    );
    /*
     * check the visits returned match the listed visits specified. Only the specified information will be checked.
     *
     * Please note:  visits must be listed in order of oldest to newest start dates.
     *
     */
    checkMonitoringTags(
      user: string,
      camera: string,
      expectedTags: string[]
    );
  }
}
