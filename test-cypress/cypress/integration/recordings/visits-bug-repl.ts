/// <reference path="../../support/index.d.ts" />

describe("Device names", () => {
  const Dee = "Dee";
  const group = "VisitTests";
  const visitorCamera = "bug";

  before(() => {
    cy.apiCreateUserGroupAndCamera(Dee, group, visitorCamera);
  });

  it("what happens if multiple calls to recordings", () => {
    const camera = "closeRecordings";
    cy.uploadRecording(visitorCamera, { minsLater: 60 });
    cy.uploadRecording(visitorCamera, { minsLater: 9 });
    cy.uploadRecording(visitorCamera, { minsLater: 9 });
    cy.uploadRecording(visitorCamera, { minsLater: 9 });
    cy.uploadRecording(visitorCamera, { minsLater: 9 });
    cy.uploadRecording(visitorCamera, { minsLater: 60 });
    cy.uploadRecording(visitorCamera, { minsLater: 9 });
    cy.uploadRecording(visitorCamera, { minsLater: 9 });
    cy.checkVisits(Dee, visitorCamera, 1);
  });
});
