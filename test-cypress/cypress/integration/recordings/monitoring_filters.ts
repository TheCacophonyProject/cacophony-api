import { getCreds } from "../../commands/server";

describe("Monitoring : filters", () => {
  const Poppy = "Poppy";
  const groupRabbits = "rabbits";
  const groupHedgehogs = "hedgehogs";
  const cameraRabbits = "cameraA";
  const cameraHedgehogs = "cameraB";
  const recordingsUploaded = false;

  const date1 = new Date(2021, 2, 3, 10);
  const afterDate1 = new Date(2021, 2, 3, 10, 30);
  const date2 = new Date(2021, 2, 3, 10, 40);
  const date3 = new Date(2021, 2, 4, 9);
  const beforeDate4 = new Date(2021, 2, 6, 9, 40);
  const date4 = new Date(2021, 2, 6, 10);

  before(() => {
    cy.apiCreateUser(Poppy);
    cy.apiCreateGroupAndCameras(Poppy, groupRabbits, cameraRabbits);
    cy.apiCreateGroupAndCameras(Poppy, groupHedgehogs, cameraHedgehogs);
  });

  beforeEach(() => {
    if (!recordingsUploaded) {
      cy.uploadRecording(cameraRabbits, { time: date1, tags: ["rabbit"] });
      cy.uploadRecording(cameraHedgehogs, { time: date2, tags: ["hedgehog"] });
      cy.uploadRecording(cameraHedgehogs, { time: date3, tags: ["hedgehog"] });
      cy.uploadRecording(cameraRabbits, { time: date4, tags: ["rabbit"] });
    }
  });

  it("Check that the group filter works", () => {
    const groupRabbitsId = getCreds(groupRabbits).id;
    const groupHedgehogsId = getCreds(groupHedgehogs).id;
    cy.checkMonitoringWithFilter(Poppy, null, { groups: groupRabbitsId }, [
      { tag: "rabbit" },
      { tag: "rabbit" }
    ]);
    cy.checkMonitoringWithFilter(
      Poppy,
      null,
      { groups: [groupRabbitsId, groupHedgehogsId] },
      [{}, {}, {}, {}]
    );
  });

  it("Check from date works", () => {
    cy.checkMonitoringWithFilter(Poppy, null, { from: afterDate1 }, [
      { start: date2 },
      { start: date3 },
      { start: date4 }
    ]);
  });

  it("Check until date works", () => {
    cy.checkMonitoringWithFilter(Poppy, null, { until: beforeDate4 }, [
      { start: date1 },
      { start: date2 },
      { start: date3 }
    ]);
  });

  it("Check that between two dates works", () => {
    cy.checkMonitoringWithFilter(
      Poppy,
      null,
      { from: afterDate1, until: beforeDate4 },
      [{ start: date2 }, { start: date3 }]
    );
  });
});
