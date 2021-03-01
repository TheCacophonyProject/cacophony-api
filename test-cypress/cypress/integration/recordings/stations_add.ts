/// <reference path="../../support/index.d.ts" />

import { add } from "cypress/types/lodash";

describe("Add and remove stations for a group", () => {
    const Josie = "Josie_stations";
  
    before(() => {
      cy.apiCreateUser(Josie);
    });
  
    it("can add stations", () => {
      const group = "add_stations"
      cy.apiCreateGroup(Josie, group);
      const stations = [{name: "Station name", lat: -43.62367659982135, lng: 172.62646754804894}];
      cy.apiUploadStations(Josie, group, stations);
    });
}); 