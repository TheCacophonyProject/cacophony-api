/// <reference path="../../support/index.d.ts" />

describe("Visits : times and recording groupings", () => {
  const Dee = "Dee_Visits";
  const group = "VisitTests";

  before(() => {
    cy.apiCreateUserGroup(Dee, group);
  });

  it("recordings less than 10mins apart are considered a single visit", () => {
    const camera = "closeRecordings";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {});
    cy.uploadRecording(camera, { minsLater: 9 });
    cy.uploadRecording(camera, { minsLater: 9 });
    cy.checkVisits(Dee, camera, [{recordings: 3}]);
  });

  it("recordings more 10mins apart are different visits", () => {
    const camera = "apartRecordings";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { });
    cy.uploadRecording(camera, { minsLater: 11 });
    cy.checkVisits(Dee, camera, [{recordings: 1}, {recordings: 1}]);
  });

  it("test start and end date of visits", () => {
    const camera = "dateTimes";
    const videoStart = new Date(2021, 1, 20, 21)
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: videoStart, tracks: [{
      start_s: 3,
      end_s: 14
    }]})
    cy.checkVisits(Dee, camera, [{start : addSeconds(videoStart, 3), end: addSeconds(videoStart, 14)}]);
  });

  it("test start and end date of visits with first track finishing later than second", () => {
    const camera = "dateTimes2";
    const videoStart = new Date(2021, 1, 20, 21)
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: videoStart, tracks: [{
      start_s: 3,
      end_s: 14
    }, 
    {
      start_s: 5,
      end_s: 12
    }]})
    cy.checkVisits(Dee, camera, [{start : addSeconds(videoStart, 3), end: addSeconds(videoStart, 14)}]);
  });

  it("test start and end date of visits with multiple videos", () => {
    const camera = "dateTimes3";
    const videoStart = new Date(2021, 1, 20, 21)
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: videoStart, tracks: [{
      start_s: 3,
      end_s: 14
    }]})
    cy.uploadRecording(camera, { 
      secsLater: 66, 
      tracks: [{
      start_s: 5,
      end_s: 12
    }]})
    cy.checkVisits(Dee, camera, [{start : addSeconds(videoStart, 3), end: addSeconds(videoStart, 66 + 12)}]);
  });
});

function addSeconds(initialTime : Date, secondsToAdd: number) : Date {
  const AS_MILLISECONDS = 1000;
  return new Date(initialTime.getTime() + secondsToAdd * AS_MILLISECONDS);
}
