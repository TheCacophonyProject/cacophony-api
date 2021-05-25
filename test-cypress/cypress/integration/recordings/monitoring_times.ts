/// <reference path="../../support/index.d.ts" />

import { addSeconds } from "../../commands/api/recording";

describe("Monitoring : times and recording groupings", () => {
  const Dexter = "Dexter";
  const group = "Monitoring_visits";

  before(() => {
    cy.apiCreateUserGroup(Dexter, group);
  });

  it("recordings less than 10 mins apart are considered a single visit", () => {
    const camera = "cam-close";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecordingsAtTimes(camera, ["21:04", "21:13", "21:22"]);
    cy.checkMonitoring(Dexter, camera, [{ recordings: 3 }]);
  });

  it("recordings more 10 mins apart are different visits", () => {
    const camera = "cam-apart";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecordingsAtTimes(camera, ["21:04", "21:15"]);
    cy.checkMonitoring(Dexter, camera, [{ recordings: 1 }, { recordings: 1 }]);
  });

  it("recordings exactly 10 mins apart end to start are different visits", () => {
    const camera = "cam-exactly-10-apart";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { duration: 60 });
    cy.uploadRecording(camera, { minsLater: 11 });
    cy.checkMonitoring(Dexter, camera, [{ recordings: 1 }, { recordings: 1 }]);
  });

  it("recordings can start more than 10 mins apart so long as gap between one finishing and the next starting is less than 10 mins", () => {
    const camera = "cam-just-close";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { duration: 61 });
    cy.uploadRecording(camera, { minsLater: 11 });
    cy.checkMonitoring(Dexter, camera, [{ recordings: 2 }]);
  });

//  This feature has been disabled by Clare
//    it("recordings with no tracks are not visits", () => {
//    const camera = "cam-notracks";
//    cy.apiCreateCamera(camera, group);
//    cy.uploadRecording(camera, { tracks:[]});
//    cy.checkMonitoring(Dexter, camera, []);
//  });

//    it("recordings with no tracks are not included in visits the fall within", () => {
//    const camera = "cam-notracks-within-visit-timespan";
//    cy.apiCreateCamera(camera, group);
//    cy.uploadRecording(camera, { });
//    cy.uploadRecording(camera, { minsLater: 5, tracks:[]});
//    cy.uploadRecording(camera, { minsLater: 10});
//    cy.checkMonitoring(Dexter, camera, [{ recordings: 2 }]);
//  });

  it("Visits where the first recording is before the start time, but overlap with search period are marked as incomplete", () => {
    const camera = "cam-start-before";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:49", duration: 300 });
    cy.uploadRecording(camera, { time: "21:02" });
    cy.uploadRecording(camera, { time: "21:22" });

    const filter = {
      from: "21:00"
    };

    cy.checkMonitoringWithFilter(Dexter, camera, filter, [{start: "20:49", incomplete: "true"}, { start:"21:22" }]);
  });

  it("Visits where the first recording is just before the search period, but don't overlap with the search period are ignored.", () => {
    const camera = "cam-before-ignore";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:51" });
    cy.uploadRecording(camera, { time: "21:22" });

    const filter = {
      from: "21:00"
    };

    cy.checkMonitoringWithFilter(Dexter, camera, filter, [{ start:"21:22" }]);
  });

  //bounday cases

    it("Visits where the last recording starts on period start time boundary is not included.", () => {
    const camera = "cam-start-boundary-case";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:40" });
    cy.uploadRecording(camera, { time: "20:50" });
    cy.uploadRecording(camera, { time: "21:00" });

    const filter = {
      from: "21:00"
    };

    cy.checkMonitoringWithFilter(Dexter, camera, filter, []);
  });


    it("Visits where the last recording ends on period end time boundary is included and complete.", () => {
    const camera = "cam-end-boundary-case";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:40" });
    cy.uploadRecording(camera, { time: "20:50" });
    cy.uploadRecording(camera, { time: "21:00" });

    const filter = {
      until: "21:00"
    };


    cy.checkMonitoringWithFilter(Dexter, camera, filter, [{ recordings: 3, start:"20:40", incomplete: "false" }]);
  });

  it("Visits which span the end-time but fall withing the collection window are included and marked as complete", () => {
    const camera = "cam-start-justbefore";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:59", duration: 300 });
    cy.uploadRecording(camera, { time: "21:05" });

    const filter = {
      until: "21:00"
    };

    cy.checkMonitoringWithFilter(Dexter, camera, filter, [{recordings: 2, start: "20:59", incomplete: "false"}]);
  });

  it("Visits where the first recording is after the end time are ignored", () => {
    const camera = "cam-start-after";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "21:01", duration: 300 });
    cy.uploadRecording(camera, { time: "21:13" });

    const filter = {
      until: "21:00"
    };

    cy.checkMonitoringWithFilter(Dexter, camera, filter, []);
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
    cy.checkMonitoringWithFilter(Dexter, camera, filter, [{ recordings: 9, incomplete: "true" }]);
  });

  it("test start and end date of visits", () => {
    const camera = "dateTimes";
    const videoStart = new Date(2021, 1, 20, 21);
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      time: videoStart,
      duration: 15,
    });
    cy.checkMonitoring(Dexter, camera, [
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
    cy.checkMonitoring(Dexter, camera, [
      { start: videoStart, end: addSeconds(videoStart, 66 + 41) }
    ]);
  });
});
