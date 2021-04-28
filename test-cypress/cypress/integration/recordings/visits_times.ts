/// <reference path="../../support/index.d.ts" />

describe("Visits : times and recording groupings", () => {
  const Dee = "Dee_Visits";
  const group = "VisitTests";

  before(() => {
    cy.apiCreateUserGroup(Dee, group);
  });

  it("recordings less than 10 mins apart are considered a single visit", () => {
    const camera = "cam-close";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {});
    cy.uploadRecording(camera, { minsLater: 9 });
    cy.uploadRecording(camera, { minsLater: 9 });
    cy.checkVisits(Dee, camera, [{ recordings: 3 }]);
  });

  it("recordings more 10 mins apart are different visits", () => {
    const camera = "cam-apart";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {});
    cy.uploadRecording(camera, { minsLater: 11 });
    cy.checkVisits(Dee, camera, [{ recordings: 1 }, { recordings: 1 }]);
  });
  
  it("recordings can start more than 10 mins apart so long as gap between one finishing and the next starting is less than 10 mins", () => {
    const camera = "cam-just-close";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { duration: 90 });
    cy.uploadRecording(camera, { minsLater: 11 });
    cy.checkVisits(Dee, camera, [{ recordings: 2 }]);
  });

  it("Visits where the first recording is before the start time are ignored", () => {
    const camera = "cam-start-before";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:49", duration: 300 });
    cy.uploadRecording(camera, { time: "21:02" });
    cy.uploadRecording(camera, { time: "21:22" });

    const filter = {
      from: "21:00"
    };

    cy.checkVisitsWithFilter(Dee, camera, filter, [{recordings: 1, start:"21:22" }]);
  });

  it("Visits where the first recording is after the end time are ignored", () => {
    const camera = "cam-start-after";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "21:01", duration: 300 });
    cy.uploadRecording(camera, { time: "21:13" });

    const filter = {
      until: "21:00"
    };

    cy.checkVisitsWithFilter(Dee, camera, filter, []);
  });

  it("Visits where maybe there are even more recordings than collected are marked as incomplete", () => {
    const camera = "justLater";
    // add 12 recordings
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:55", duration: 300 });
    for (let i = 0; i < 11; i++) {
      cy.uploadRecording(camera, { minsLater: 9 });
    };

    const filter = {
      until: "21:00"
    };

    // only 9 recordings are collected from the database
    cy.checkVisitsWithFilter(Dee, camera, filter, [{ recordings: 9, incomplete: "true" }]);
  });

  it("test start and end date of visits", () => {
    const camera = "dateTimes";
    const videoStart = new Date(2021, 1, 20, 21);
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      time: videoStart,
      duration: 15,
    });
    cy.checkVisits(Dee, camera, [
      { start: videoStart, end: addSeconds(videoStart, 15) }
    ]);
  });

  it("test start and end date of visits with multiple videos", () => {
    const camera = "dateTimes3";
    const videoStart = new Date(2021, 1, 20, 21);
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      time: videoStart,
      duration: 23,
    });
    cy.uploadRecording(camera, {
      secsLater: 66,
      duration:41
    });
    cy.checkVisits(Dee, camera, [
      { start: videoStart, end: addSeconds(videoStart, 66 + 41) }
    ]);
  });
});


function addSeconds(initialTime: Date, secondsToAdd: number): Date {
  const AS_MILLISECONDS = 1000;
  return new Date(initialTime.getTime() + secondsToAdd * AS_MILLISECONDS);
}
