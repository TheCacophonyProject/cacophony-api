// load the global Cypress types
/// <reference types="cypress" />

// Station data as supplied to API on creation.
export interface CreateStationData {
    name: string;
    lat: number;
    lng: number;
}

declare namespace Cypress {
    interface Chainable {
        /**
         * upload stations data for a group
         * 
         * Please note:  visits must be listed in order of oldest to newest start dates. 
         * 
         */
        apiUploadStations(
        user: string,
        group: string,
        stations: CreateStationData[] 
        );
    }
}
  