/// <reference path="../../support/index.d.ts" />

describe("Stations: add and remove", () => {
  const Josie = "Josie_stations";
  const group = "add_stations";

  before(() => {
    cy.apiCreateUserGroup(Josie, group);
    const stations = [
      { name: "forest", lat: -43.62367659982, lng: 172.62646754804},
      // { name: "stream", lat: -43.62367659983, lng: 172.62646754804}
    ];
    cy.apiUploadStations(Josie, group, stations);
  });

  it("recordings are assigned to the correct stations", () => {
    cy.apiCreateCamera("in-forest", group);
    cy.uploadRecording("in-forest", { lat: -43.62367659982, lng: 172.62646754804})
      .thenCheckStationIs(Josie, "forest");

    // cy.apiCreateCamera("in-stream", group);
    // cy.uploadRecording("in-stream", { lat: -43.62367659983, lng: 172.62646754804})
    //   .thenCheckStationIs(Josie, "stream");

  });
  
  it("recording that is not close to any station is not assigned a station", () => {
    cy.apiCreateCamera("neither", group);
    cy.uploadRecording("neither", { lat: -43.6, lng: 172.6}).thenCheckStationIs(Josie, "");
  });
});
