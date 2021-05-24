// load the global Cypress types
/// <reference types="cypress" />

// Station data as supplied to API on creation.
interface CreateStationData {
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
      stations: CreateStationData[], 
      updateFrom?: Date
    );

    /**
     * upload stations data for a group
     */
    apiCheckStations(
      user: string,
      group: string,
      stations: CreateStationData[]
    );

    // to be run straight after an uploadRecording
    // check that the recording has been assigned the right station name. sS
    thenCheckStationIs(user: string, station: string);

    // Only works if there is a single recording for the user
    checkRecordingsStationIs(user: string, station: string);
  }
}
