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
         */
        apiUploadStations(
        user: string,
        group: string,
        stations: CreateStationData[] 
        );

        /**
         * upload stations data for a group
         */
        apiCheckStations(
            user: string,
            group: string,
            stations: CreateStationData[] 
            );
    }
}
  