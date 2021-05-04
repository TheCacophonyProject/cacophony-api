/// <reference path="../../support/index.d.ts" />

describe("Monitoring : evaluate ai model", () => {  
  const Claris = "Claris";
  const group = "Visit-ai";
  
  before(() => {
      cy.apiCreateUserGroup(Claris, group);
    });
    
  it("By default, AI-tag returns what the AI Master model produces.  ", () => {
    const camera = "ai-default";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { model: "Master", tags: ["possum"] });
    cy.uploadRecording(camera, { model: "Catter", tags: ["cat"] });
    cy.checkMonitoring(Claris, camera, [{tag: "possum", aiTag: "possum"}]);
  });

  it("If an ai model is specified then it uses that model to calculate the results.  ", () => {
    const camera = "ai-different";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { model: "Master", tags: ["possum"] });
    cy.uploadRecording(camera, { model: "Catter", tags: ["cat"] });
    cy.checkMonitoringWithFilter(Claris, camera, {ai: "Catter"}, [{tag: "possum", aiTag: "cat"}]);
  });

  it("If an ai model is specified then it uses that model to calculate the results.  ", () => {
    const camera = "ai-users-best";
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { model: "Catter", tags: ["rat"] });
    cy.uploadRecording(camera, { model: "Catter", tags: ["cat"] });
    cy.uploadRecording(camera, { model: "Catter", tags: ["cat"] });
    cy.checkMonitoringWithFilter(Claris, camera, {ai: "Catter"}, [{tag: "none", aiTag: "cat"}]);
  });

});