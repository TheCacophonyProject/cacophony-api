/// <reference path="../../support/index.d.ts" />

describe("Visits : tracks and tags", () => {
  const Donna = "Donna_visits";
  const Gee = "Gee_visits";

  const group = "VisitTags";

  before(() => {
    cy.apiCreateUserGroup(Donna, group);
  });

  it("recordings with no tracks do not create a visit", () => {
    const camera = "no_tracks";
    const notracks = [];
    const noVisits = [];
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tracks: notracks });
    cy.checkVisits(Donna, camera, noVisits);
  });

  it("all automatic tags other than master are ignored - to prevent wallaby ai being used on other projects", () => {
    const camera = "only_master";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { model: "different", tags: ["cat"] });
    cy.checkVisitTags(Donna, camera, ["none"]);
  });

  it("each recording contributes votes for what the animal is", () => {
    const camera = "multiple_tracks";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tags: ["possum", "rat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.checkVisitTags(Donna, camera, ["cat"]);
  });

  it("each track in a recording gets contributes a vote for what the animal is", () => {
    const camera = "multiple_tracks2";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tags: ["possum", "rat", "rat", "rat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.uploadRecording(camera, { tags: ["cat"] });
    cy.checkVisitTags(Donna, camera, ["rat"]);
  });

  it("track tag 'unidentified` is ignored when deciding label to use", () => {
    const camera = "has_unidentified";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      tags: ["possum", "unidentified", "unidentified", "unidentified"]
    });
    cy.checkVisitTags(Donna, camera, ["possum"]);
  });

  it("What happens when user tags as 'unidentified`?", () => {
    const camera = "user_unidentified_tracks";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tags: ["possum"] }).thenUserTagAs(
      Donna,
      "unidentified"
    );
    cy.checkVisitTags(Donna, camera, ["unidentified"]);
  });

  it("if a user tags a track then this is what should be used as the track tag", () => {
    const camera = "userTagged";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tracks: [{ tag: "cat" }] }).thenUserTagAs(
      Donna,
      "rabbit"
    );
    cy.checkVisitTags(Donna, camera, ["rabbit"]);
  });

  it("User tag is preferred over AI tag", () => {
    const camera = "userVsMultiple";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      tags: ["possum", "rat", "rat"]
    }).thenUserTagAs(Donna, "rabbit");
    cy.uploadRecording(camera, { tags: ["possum"] });
    cy.checkVisitTags(Donna, camera, ["rabbit"]);
  });

  it("User animal tag is preferred over user unknown tag", () => {
    const camera = "userAnimalUnknown";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {
      tags: ["unidentified", "unidentified", "unidentified"]
    }).then((recID: number) => {
      cy.userTagRecording(recID, 0, Donna, "possum");
      cy.userTagRecording(recID, 1, Donna, "unknown");
      cy.userTagRecording(recID, 2, Donna, "unknown");
    });
    cy.checkVisitTags(Donna, camera, ["possum"]);
  });
  it("User tags conflict", () => {
    const camera = "conflicter";
    cy.apiCreateUser(Gee);
    cy.apiAddUserToGroup(Donna, Gee, group, true);
    cy.apiCreateCamera(camera, group);
    const recording = cy.uploadRecording(camera, {
      tags: ["possum", "rabbit"]
    });
    recording.then((recID: number) => {
      cy.userTagRecording(recID, 0, Donna, "possum");
      cy.userTagRecording(recID, 0, Gee, "rat");
    });
    cy.checkVisitTags(Donna, camera, ["conflicting tags"]);
  });
});
