/// <reference path="../../support/index.d.ts" />

describe("Alerts : recordings get alerted", () => {
  const Tiny = "TinyAlerts";

  const AlertGroup = "AlertGroup";
  const RoadCamera = "RoadCamera";
  const TreeCamera = "TreeCamera";

  before(() => {
    cy.apiCreateUserGroup(Tiny, AlertGroup);
    cy.apiCreateCamera(TreeCamera, AlertGroup);

  });

  it("device without alerts doesn't send alert", () => {
    const camera = "no_alerts";
    cy.apiCreateCamera(camera, AlertGroup);
    cy.uploadRecording(camera, { tracks:  { tags: ["possum", "rat"] } });
    cy.checkAlerts(Tiny,camera,[])
  });

});
