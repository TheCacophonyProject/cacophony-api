/// <reference path="../../support/index.d.ts" />

describe("Device names", () => {
  const Dee = "Dee";
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
    cy.checkVisits(Dee, camera, 1);
  });

  it("recordings more 10mins apart are different visits", () => {
    const camera = "apartRecordings";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: new Date(2021, 1, 15, 21) });
    cy.uploadRecording(camera, { minsLater: 11 });
    cy.checkVisits(Dee, camera, 2);
  });
});
