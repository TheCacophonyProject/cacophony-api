/// <reference path="../../support/index.d.ts" />

describe("Visits : tracks and tags", () => {
    const Dee = "Donna_visits";
    const Gee = "Gee_visits";
  
    const group = "VisitTags";
  
    before(() => {
      cy.apiCreateUserGroup(Dee, group);
    });
  
    it("recordings with no tracks do not create a visit", () => {
      const camera = "no_tracks";
      const notracks = [];
      const noVisits = [];
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, { tracks: notracks });
      cy.checkVisits(Dee, camera, noVisits);
    });
  
    it("all automatic tags other than master are ignored - to prevent wallaby ai being used on other projects", () => {
      const camera = "only_master";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, { model: "different", tags: ["cat"] });
      cy.checkVisitTags(Dee, camera, ["<null>"]);
    });
  
    it("each recording contributes a vote for what the animal is", () => {
      const camera = "multiple_tracks";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, { tags: ["possum", "rat"] });
      cy.uploadRecording(camera, { tags: ["cat"] });
      cy.uploadRecording(camera, { tags: ["cat"] });
      cy.checkVisitTags(Dee, camera, ["cat"]);
    });
  
    it("each track in a recording gets contributes a vote for what the animal is", () => {
      const camera = "multiple_tracks2";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, { tags: ["possum", "rat", "rat", "rat"] });
      cy.uploadRecording(camera, { tags: ["cat"] });
      cy.uploadRecording(camera, { tags: ["cat"] });
      cy.checkVisitTags(Dee, camera, ["rat"]);
    });
  
    it("track tag 'unidentified` is ignored when deciding label to use", () => {
      const camera = "has_unidentified";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, {
        tags: ["possum", "unidentified", "unidentified", "unidentified"]
      });
      cy.checkVisitTags(Dee, camera, ["possum"]);
    });
  
    it("What happens when user tags as 'unidentified`?", () => {
      const camera = "user_unidentified_tracks";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, { tags: ["possum"] }).thenUserTagAs(
        Dee,
        "unidentified"
      );
      cy.checkVisitTags(Dee, camera, ["unidentified"]);
    });
  
    it("if a user tags a track then this is what should be used as the track tag", () => {
      const camera = "userTagged";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, { tracks: [{ tag: "cat" }] }).thenUserTagAs(
        Dee,
        "rabbit"
      );
      cy.checkVisitTags(Dee, camera, ["rabbit"]);
    });
  
    it("User tag is preferred over AI tag", () => {
      const camera = "userVsMultiple";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, {
        time: new Date(2021, 1, 20, 21),
        tags: ["possum", "rat", "rat"]
      }).thenUserTagAs(Dee, "rabbit");
      cy.uploadRecording(camera, { tags: ["possum"] });
      cy.checkVisitTags(Dee, camera, ["rabbit"]);
    });
  
    it("User animal tag is preferred over user unknown tag", () => {
      const camera = "userAnimalUnknown";
      cy.apiCreateCamera(camera, group);
      cy.uploadRecording(camera, {
        tags: ["unidentified", "unidentified", "unidentified"]
      }).then((recID: number) => {
        cy.userTagRecording(recID, 0, Dee, "possum");
        cy.userTagRecording(recID, 1, Dee, "unknown");
        cy.userTagRecording(recID, 2, Dee, "unknown");
      });
      cy.checkVisitTags(Dee, camera, ["possum"]);
    });
    it("User tags conflict", () => {
      const camera = "conflicter";
      cy.apiCreateUser(Gee);
      cy.apiAddUserToGroup(Dee, Gee, group, true);
      cy.apiCreateCamera(camera, group);
      const recording = cy.uploadRecording(camera, {
        time: new Date(2021, 1, 20, 21),
        tags: ["possum"]
      });
      recording.then((recID: number) => {
        cy.userTagRecording(recID, 0, Dee, "possum");
        cy.userTagRecording(recID, 0, Gee, "rat");
      });
      cy.checkVisitTags(Dee, camera, ["conflicting tags"]);
    });

  });
