/// <reference path="../../support/index.d.ts" />

describe("Visits : pagings", () => {
  const Veronica = "Veronica_visits";

  const group = "visits-paging";

  before(() => {
    cy.apiCreateUserGroup(Veronica, group);
  });

  it("recordings are broken into approximate pages by start date", () => {
    const camera = "basic";
    const firstRecording = "10:03";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: firstRecording });
    cy.uploadRecording(camera, {minsLater: 20});
    cy.uploadRecording(camera, {minsLater: 20});
    cy.uploadRecording(camera, {minsLater: 20});    
    cy.uploadRecording(camera, {minsLater: 20});
    cy.uploadRecording(camera, {minsLater: 20});
    cy.uploadRecording(camera, {minsLater: 20});
    cy.uploadRecording(camera, {minsLater: 20});

    cy.checkVisitsWithFilter(Veronica, camera, {"page-size": 3, page: 1}, [{}, {}, {}]);
    cy.checkVisitsWithFilter(Veronica, camera, {"page-size": 3, page: 2}, [{}, {}, {}]);
    cy.checkVisitsWithFilter(Veronica, camera, {"page-size": 3, page: 3}, [{}, {}]);
    cy.checkVisitsWithFilter(Veronica, camera, {"page-size": 3, page: 4}, []);
  });


  it("visits can finish for some cameras beyond the start time for others", () => {
    const Henry = "Henry";
    const group = "visits-two-cams";
    cy.apiCreateUserGroup(Henry, group);
    const camera1 = "cam-1";
    const camera2 = "cam-2";
    const recording1 = "21:03";
    const recording2a = "21:13";
    const recording3 = "21:14";
    const recording2b = "21:18";
    const recording4 = "21:25";
    const recording2c = "21:27";
    cy.apiCreateCamera(camera1, group);
    cy.apiCreateCamera(camera2, group);


    cy.uploadRecording(camera1, { time: recording1 });
    cy.uploadRecording(camera2, { time: recording2a });
    cy.uploadRecording(camera1, { time: recording3 });
    cy.uploadRecording(camera2, { time: recording2b });
    cy.uploadRecording(camera1, { time: recording4 });
    cy.uploadRecording(camera2, { time: recording2c });

    cy.checkVisitsWithFilter(Henry, null, {"page-size": 3, page: 1}, [{ recordings : 3,  start: recording2a,}, { recordings: 1, start: recording3}, { recordings: 1, start: recording4}]);
    cy.checkVisitsWithFilter(Henry, null, {"page-size": 3, page: 2}, [{ recordings : 1, start: recording1}]);
  });

  it("vists can start at exactly the same time on multiple cameras and paging still works (even if all pages won't be equal size).", () => {
    const Bobletta = "Bobletta";
    const group = "visits-same-time";
    cy.apiCreateUserGroup(Bobletta, group);
    const camera1 = "cam-1";
    const camera2 = "cam-2";
    const camera3 = "cam-3";
    const visitTime = "21:10";
    const nextVisitTime = "21:33";
    cy.apiCreateCamera(camera1, group);
    cy.apiCreateCamera(camera2, group);
    cy.apiCreateCamera(camera3, group);


    cy.uploadRecording(camera1, { time: visitTime });
    cy.uploadRecording(camera2, { time: visitTime });
    cy.uploadRecording(camera3, { time: visitTime });
    cy.uploadRecording(camera1, { time: nextVisitTime });

    cy.checkVisitsWithFilter(Bobletta, null, {"page-size": 2, page: 2}, [{ start: visitTime}, { start: visitTime}, { start: visitTime}]);
    cy.checkVisitsWithFilter(Bobletta, null, {"page-size": 2, page: 1}, [{ start: nextVisitTime}]);
  });
});
