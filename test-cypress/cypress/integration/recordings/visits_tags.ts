/// <reference path="../../support/index.d.ts" />

describe("Device names", () => {
  const Dee = "Dee_Visits";
  const group = "VisitTests";

  before(() => {
    cy.apiCreateUserGroup(Dee, group);
  });

  it("recordings with no tracks do not create a visit", () => {
    const camera = "no_tracks";
    const notracks = [];
    const noVisits = [];
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tracks: notracks});
    cy.checkVisits(Dee, camera, noVisits);
  });

  
  it("each recording contributes a vote for what the animal is", () => {
    const camera = "multiple_tracks";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {  tags: ["possum", "rat"]});
    cy.uploadRecording(camera, {  tags: ["cat"] });
    cy.uploadRecording(camera, {  tags: ["cat"] });
    cy.checkVisitTags(Dee, camera, ["cat"]);
  });
  
  it("each track in a recording gets contributes a vote for what the animal is", () => {
    const camera = "multiple_tracks2";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {  tags: ["possum", "rat", "rat", "rat"]});
    cy.uploadRecording(camera, {  tags: ["cat"] });
    cy.uploadRecording(camera, {  tags: ["cat"] });
    cy.checkVisitTags(Dee, camera, ["rat"]);
  });

  it("track tag 'unidentified` is ignored when deciding label to use", () => {
    const camera = "has_unidentified";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {  tags: ["possum", "unidentified", "unidentified", "unidentified"]});
    cy.checkVisitTags(Dee, camera, ["possum"]);
  });

  it("What happens when user tags as 'unidentified`?", () => {
    const camera = "user_unidentified_tracks";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {  tags: ["possum"]}).thenUserTagAs(Dee, "unidentified");
    cy.checkVisitTags(Dee, camera, ["unidentified"]);
  });

  it("if a user tags a track then this is what should be used as the track tag", () => {
    const camera = "userTagged";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tracks: [{tag: "cat"}]}).thenUserTagAs(Dee, "rabbit");
    cy.checkVisitTags(Dee, camera, ["rabbit"]);
  });

  it.skip("unfortunately user tags only count as much as one computer tag so this could be a problem..soo", () => {   
    const camera = "userVsMultiple";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: new Date(2021, 1, 20, 21), tags: ["possum", "rat", "rat"]}).thenUserTagAs(Dee, "rabbit");;
    cy.uploadRecording(camera, { tags: ["possum"]})
    cy.checkVisitTags(Dee, camera, ["rabbit"]);
  });
});
