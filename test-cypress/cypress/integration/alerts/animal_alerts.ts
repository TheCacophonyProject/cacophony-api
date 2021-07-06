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
    cy.uploadRecording(camera, {
      processingState: "FINISHED",
      tags: ["possum", "rat"]
    });
    cy.checkAlerts(Tiny, camera, []);
  });

  it("device gets alert for possum", () => {
    const camera = "possum_alert";
    cy.apiCreateCamera(camera, AlertGroup);
    cy.apiCreateAlert(Tiny, "possum", camera, "possum1");

    cy.uploadRecording(camera, {
      processingState: "FINISHED",
      tags: ["possum"]
    }).then((recID: number) => {
      cy.checkAlerts(Tiny, camera, [{ recId: recID }]);
      cy.uploadRecording(camera, {
        processingState: "FINISHED",
        tags: ["rat"]
      });
      cy.checkAlerts(Tiny, camera, [{ recId: recID }]);
    });
  });

  it("device gets alert no alert for rat", () => {
    const camera = "not a rat alert";
    cy.apiCreateCamera(camera, AlertGroup);
    cy.apiCreateAlert(Tiny, "possum", camera, "possum1");

    cy.uploadRecording(camera, { processingState: "FINISHED", tags: ["rat"] });
    cy.checkAlerts(Tiny, camera, []);
  });

  it("device gets alert based of visit tag", () => {
    const camera = "possum visit";
    cy.apiCreateCamera(camera, AlertGroup);
    cy.apiCreateAlert(Tiny, "possum", camera, "possum1");

    cy.uploadRecording(camera, {
      processingState: "FINISHED",
      tags: ["rat", "possum", "possum"]
    }).then((recID: number) => {
      cy.checkAlerts(Tiny, camera, [{ recId: recID }]);
    });
  });
});
