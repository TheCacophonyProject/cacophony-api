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
    cy.uploadRecording(camera,  { tags: ["possum", "rat"] });
    cy.checkAlerts(Tiny,camera,[])
  });

    it("device gets alert for possum", () => {
      const camera = "possum_alert";
      cy.apiCreateCamera(camera, AlertGroup);
      cy.apiCreateAlert(Tiny,"possum",camera, "possum1");

      cy.uploadRecording(camera,  { tags: ["possum", "rat"] }).then((recID: number) => {
        cy.checkAlerts(Tiny,camera,[{name: "possum1", recID: recID}])
      });
      cy.uploadRecording(camera,  { tags: ["rat"] }).then((recID: number) => {
        cy.checkAlerts(Tiny,camera,[{name: "possum1", recID: recID}])
      });
    });
});
