/// <reference path="../../support/index.d.ts" />

describe("Stations: add and remove", () => {
  const Josie = "Josie_stations";
  const group = "add_stations";
  const forestLatLong = { lat: -43.62367659982, lng: 172.62646754804};
  const date = new Date(2021, 3, 25, 21);
  const earlier = new Date(2021, 3, 25, 20);
  const later = new Date(2021, 3, 25, 22);

  before(() => {
    cy.apiCreateUserGroup(Josie, group);
    const stations = [
      { name: "forest", lat: -43.62367659982, lng: 172.62646754804},
      { name: "stream", lat: -43.62367659983, lng: 172.62646754804}
    ];
    cy.apiUploadStations(Josie, group, stations);
  });

  it.skip("recordings are assigned to the correct stations", () => {
    cy.apiCreateCamera("in-forest", group);
    cy.uploadRecording("in-forest", forestLatLong)
      .thenCheckStationIs(Josie, "forest");

    cy.apiCreateCamera("in-stream", group);
    cy.uploadRecording("in-stream", { lat: -43.62367659983, lng: 172.62646754804})
      .thenCheckStationIs(Josie, "stream");

  });
  
  it("recording that is not close to any station is not assigned a station", () => {
    cy.apiCreateCamera("neither", group);
    cy.uploadRecording("neither", { lat: -43.6, lng: 172.6}).thenCheckStationIs(Josie, "");
  });

  it("recordings in another group are not assigned a station", () => {
    const otherGroup = "Josies-other";
    const camera = "other-group";
    cy.apiCreateGroup(Josie, otherGroup);
    cy.apiCreateCamera(camera, otherGroup);
    cy.uploadRecording(camera, forestLatLong)
      .thenCheckStationIs(Josie, "");
  });

  it ("recordings are not updated if before date specified", () => {
    const Josie2 = "Josie2"
    const groupUpdate = "update-stations";
    const camera = "update-after";
    cy.apiCreateUserGroupAndCamera(Josie2, groupUpdate, camera);
    cy.uploadRecording(camera, {time: date, lat: -43.6, lng: 172.8})
    cy.checkRecordingsStationIs(Josie2, "");

    const stations = [
      { name: "forest", lat: -43.62367659982, lng: 172.62646754804},
      { name: "waterfall", lat: -43.6, lng: 172.8}
    ];
    cy.apiUploadStations(Josie2, groupUpdate, stations, later);
    cy.checkRecordingsStationIs(Josie2, "");
  });


  it ("recordings are updated if after date specified", () => {
    const Josie3 = "Josie3";
    const camera = "update-earlier";
    const groupNotUpdate = "not-update-stations";
    cy.apiCreateUserGroupAndCamera(Josie3, groupNotUpdate, camera);
    cy.uploadRecording(camera, {time: date, lat: -43.6, lng: 172.8})
    cy.checkRecordingsStationIs(Josie3, "");

    const stations = [
      { name: "forest", lat: -43.62367659982, lng: 172.62646754804},
      { name: "waterfall", lat: -43.6, lng: 172.8}
    ];
    cy.apiUploadStations(Josie3, groupNotUpdate, stations, earlier);
    cy.checkRecordingsStationIs(Josie3, "waterfall");
  });

  it.skip ("recordings will lose their station assignment if the station is removed", () => {
    const Josie4 = "Josie4";
    const camera = "update-remove";
    const groupRemove = "remove-station";
    const date = new Date(2021, 3, 25, 21);
    const earlier = new Date(2021, 3, 25, 20);
    cy.apiCreateUserGroupAndCamera(Josie4, groupRemove, camera);
    const stations = [
      { name: "waterfall", lat: -43.6, lng: 172.8}
    ];
    cy.apiUploadStations(Josie4, groupRemove, stations, earlier);
    cy.uploadRecording(camera, {time: date, lat: -43.6, lng: 172.8})
    cy.checkRecordingsStationIs(Josie4, "waterfall");

    const stations2 = [
      { name: "forest", lat: -43.62367659982, lng: 172.62646754804},
    ];
    cy.apiUploadStations(Josie4, groupRemove, stations2, earlier);
    cy.checkRecordingsStationIs(Josie4, "");
  });

});
