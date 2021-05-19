/// <reference path="../../support/index.d.ts" />

describe("Monitoring : pagings", () => {
  const Veronica = "Veronica_visits";

  const group = "visits-paging";

  before(() => {
    cy.apiCreateUserGroup(Veronica, group);
  });

  it("recordings are broken into approximate pages by start date", () => {
    const camera = "basic";
    const firstRecording = "10:03";

    cy.apiCreateCamera(camera, group);
    cy.uploadRecordingsAtTimes(camera, ["21:03", "21:23", "21:43", "22:03", "22:23", "22:43", "23:03"]);

    cy.checkMonitoringWithFilter(Veronica, camera, {"page-size": 3, page: 1}, [{start: "22:23"}, {start: "22:43"}, {start: "23:03"}]);
    cy.checkMonitoringWithFilter(Veronica, camera, {"page-size": 3, page: 2}, [{start: "21:23"}, {start: "21:43"}, {start: "22:03"}]);
    cy.checkMonitoringWithFilter(Veronica, camera, {"page-size": 3, page: 3}, [{start: "21:03"}]);
  });


  it("visits can finish for some cameras beyond the start time for others", () => {
    const Henry = "Henry";
    const group = "visits-two-cams";
    cy.apiCreateUserGroup(Henry, group);
    const camera1 = "cam-1";
    const camera2 = "cam-2";
    cy.apiCreateCamera(camera1, group);
    cy.apiCreateCamera(camera2, group);
    cy.uploadRecordingsAtTimes(camera1, ["21:03", "21:14", "21:25"]);
    cy.uploadRecordingsAtTimes(camera2, ["21:13", "21:18", "21:27"]); // all one visit

    cy.checkMonitoringWithFilter(Henry, null, {"page-size": 3, page: 1}, [{ recordings : 3,  start: "21:13",}, { recordings: 1, start: "21:14"}, { recordings: 1, start: "21:25"}]);
    cy.checkMonitoringWithFilter(Henry, null, {"page-size": 3, page: 2}, [{ recordings : 1, start: "21:03"}]);
  });

  it("visits can start at exactly the same time on multiple cameras and paging still works (even if all pages won't be equal size).", () => {
    const Bobletta = "Bobletta";
    const group = "visits-same-time";
    const camera1 = "cam-1";
    const camera2 = "cam-2";
    const camera3 = "cam-3";
    const visitTime = "21:10";
    const nextVisitTime = "21:33";
    cy.apiCreateUser(Bobletta);
    cy.apiCreateGroupAndCameras(Bobletta, group, camera1, camera2, camera3);

    cy.uploadRecording(camera1, { time: visitTime });
    cy.uploadRecording(camera2, { time: visitTime });
    cy.uploadRecording(camera3, { time: visitTime });
    cy.uploadRecording(camera1, { time: nextVisitTime });

    cy.checkMonitoringWithFilter(Bobletta, null, {"page-size": 2, page: 2}, [{ start: visitTime}, { start: visitTime}, { start: visitTime}]);
    cy.checkMonitoringWithFilter(Bobletta, null, {"page-size": 2, page: 1}, [{ start: nextVisitTime}]);
  });

  it("visits that start before search period but cross into search period are only shown on the last page", () => {
    const camera = "close recordings";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecordingsAtTimes(camera, ["21:03", "21:13", "21:40", "21:45", "22:10", "22:40", "23:10"]);

    cy.checkMonitoringWithFilter(Veronica, 
      camera, 
      {"page-size": 3, page: 1, from: "21:10"}, 
      [{ start: "22:10"}, { start: "22:40"}, { start: "23:10"}]);

    cy.checkMonitoringWithFilter(Veronica, camera, 
      {"page-size": 3, page: 2, from: "21:10"}, 
      [{ start: "21:03", incomplete: "true"}, {start: "21:40"}]);
    });
});
