/// <reference path="../../support/index.d.ts" />

describe('Device names', () => {

  const Dee = "Dee";
  const group = "VisitTests"
  const visitorCamera = "visitorH";

  before(() => {
    cy.apiCreateUserGroupAndCamera(Dee, group, visitorCamera);
  });

  it('recordings less than 10mins apart are considered a single visit', () => {
    cy.uploadRecording(visitorCamera, {});
    cy.uploadRecording(visitorCamera, {minsLater: 9});
    cy.checkVisits(Dee, visitorCamera, 1);
  });

  it('recordings more 10mins apart are different visits', () => {
    const camera = 'apartVisits';
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, {time : new Date(2021,1,15,21)});
    cy.uploadRecording(camera, {minsLater: 11});
    cy.checkVisits(Dee, camera, 2);
  });
});
