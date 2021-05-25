/// <reference path="../../support/index.d.ts" />

describe("Monitoring : tracks and tags", () => {
  const Damian = "Damian";
  const Gerry = "Gerry";

  const group = "MonitoringTags";

  before(() => {
    cy.apiCreateUserGroup(Damian, group);
  });

  // at the moment many tracks are being missed so we can't do this.  
  // it is also a bit confusing for users - where did my recording go?
  it.skip ("recordings with no tracks do not create a visit", () => {
    const camera = "no_tracks";
    const notracks = [];
    const noVisits = [];
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tracks: notracks });
    cy.checkMonitoring(Damian, camera, noVisits);
  });

  it("all automatic tags other than master are ignored - to prevent wallaby ai being used on other projects", () => {
    const camera = "only_master";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { model: "different", tags: ["cat"] });
    cy.checkMonitoringTags(Damian, camera, ["none"]);
  });

  it("each recording contributes votes for what the animal is", () => {
    const camera = "multiple_tracks";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tags: ["possum", "rat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.checkMonitoringTags(Damian, camera, ["cat"]);
  });

  it("each track in a recording gets contributes a vote for what the animal is", () => {
    const camera = "multiple_tracks2";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tags: ["possum", "rat", "rat", "rat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.checkMonitoringTags(Damian, camera, ["rat"]);
  });

  it("track tag 'unidentified` is ignored when deciding label to use", () => {
    const camera = "has_unidentified";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      tags: ["possum", "unidentified", "unidentified", "unidentified"]
    });
    cy.checkMonitoringTags(Damian, camera, ["possum"]);
  });

  it("What happens when user tags as 'unidentified`?", () => {
    const camera = "user_unidentified_tracks";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tags: ["possum"] }).thenUserTagAs(
      Damian,
      "unidentified"
    );
    cy.checkMonitoringTags(Damian, camera, ["unidentified"]);
  });

  it("if a user tags a track then this is what should be used as the track tag", () => {
    const camera = "userTagged";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tracks: [{ tag: "cat" }] }).thenUserTagAs(
      Damian,
      "rabbit"
    );
    cy.checkMonitoringTags(Damian, camera, ["rabbit"]);
  });

  it("User tag is preferred over AI tag", () => {
    const camera = "userVsMultiple";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      tags: ["possum", "rat", "rat"]
    }).thenUserTagAs(Damian, "rabbit");
    cy.uploadRecording(camera, { tags: ["possum"] });
    cy.checkMonitoringTags(Damian, camera, ["rabbit"]);
  });


  it("When user tag and AI tag aggree", () => {
    const camera = "tagsagree";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      tags: ["possum", "rat", "rat"]
    }).thenUserTagAs(Damian, "possum");
    cy.uploadRecording(camera, { tags: ["possum"] });
    cy.checkMonitoringTags(Damian, camera, ["possum"]);
  });
  
  it("User animal tag is preferred over user unknown tag", () => {
    const camera = "userAnimalUnknown";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      tags: ["unidentified", "unidentified", "unidentified"]
    }).then((recID: number) => {
      cy.userTagRecording(recID, 0, Damian, "possum");
      cy.userTagRecording(recID, 1, Damian, "unknown");
      cy.userTagRecording(recID, 2, Damian, "unknown");
    });
    cy.checkMonitoringTags(Damian, camera, ["possum"]);
  });
  it("User tags conflict", () => {
    const camera = "conflicter";
    cy.apiCreateUser(Gerry);
    cy.apiAddUserToGroup(Damian, Gerry, group, true);
    cy.apiCreateCamera(camera, group);
    const recording = cy.uploadRecording(camera, {
      tags: ["possum", "rabbit"]
    });
    recording.then((recID: number) => {
      cy.userTagRecording(recID, 0, Damian, "possum");
      cy.userTagRecording(recID, 0, Gerry, "rat");
    });
    cy.checkMonitoringTags(Damian, camera, ["conflicting tags"]);
  });
  it("User tags conflict on one of many tracks majority wins", () => {
    const camera = "conflicter-multiple";
    cy.apiCreateCamera(camera, group);
    const recording = cy.uploadRecording(camera, {
      tags: ["possum", "rabbit"]
    });
    recording.then((recID: number) => {
      cy.userTagRecording(recID, 0, Damian, "possum");
      cy.userTagRecording(recID, 0, Gerry, "rat");
    });
    cy.uploadRecording(camera, { tags: ["possum", "rat"] }).thenUserTagAs(Damian, "possum");
    cy.uploadRecording(camera, { tags: ["cat"] }).thenUserTagAs(Damian, "possum");

    cy.checkMonitoringTags(Damian, camera, ["possum"]);
  });

});
