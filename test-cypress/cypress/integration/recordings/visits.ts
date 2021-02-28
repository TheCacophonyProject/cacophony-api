/// <reference path="../../support/index.d.ts" />

describe("Device names", () => {
  const Dee = "Dee_Visits";
  const group = "VisitTests";
  const visitorCamera = "visitorH";

  before(() => {
    cy.apiCreateUserGroup(Dee, group);
  });

  it("recordings less than 10mins apart are considered a single visit", () => {
    const camera = "closeRecordings";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {});
    cy.uploadRecording(camera, { minsLater: 9 });
    cy.checkVisits(Dee, camera, [{recordings: 2}]);
  });

  it("recordings more 10mins apart are different visits", () => {
    const camera = "apartRecordings";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: new Date(2021, 1, 15, 21) });
    cy.uploadRecording(camera, { minsLater: 11 });
    cy.checkVisits(Dee, camera, [{recordings: 1}, {recordings: 1}]);
  });

  it("recordings with no tracks do not create a visit", () => {
    const camera = "no_tracks";
    const notracks = [];
    const noVisits = [];
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: new Date(2021, 1, 17, 21), tracks: notracks});
    cy.checkVisits(Dee, camera, noVisits);
  });

  it("each track in a recording gets contributes a vote for what the animal is", () => {
    const camera = "multiple_tracks";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: new Date(2021, 1, 20, 21), tags: ["possum", "rat", "rat", "rat"]});
    cy.uploadRecording(camera, {  tags: ["cat"] });
    cy.uploadRecording(camera, {  tags: ["cat"] });
    cy.checkVisitTags(Dee, camera, ["rat"]);
  });

  it("if a user tags a track then this is what should be used as the track tag", () => {
    const camera = "userTagged";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { tracks: [{tag: "cat"}]}).thenUserTagAs(Dee, "rabbit");
    cy.checkVisitTags(Dee, camera, ["rabbit"]);
  });

  it("unfortunately user tags only count as much as one computer tag so this could be a problem..soo", () => {   
    const camera = "userVsMultiple";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: new Date(2021, 1, 20, 21), tags: ["possum", "rat", "rat"]}).thenUserTagAs(Dee, "rabbit");;
    cy.uploadRecording(camera, { tags: ["possum"]})
    cy.checkVisitTags(Dee, camera, ["rabbit"]);
  });
});
