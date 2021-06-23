describe("Monitoring : multiple cameras and stations", () => {
  const Penny = "Penny";

  before(() => {
    cy.apiCreateUser(Penny);
  });

  it("Recordings at the same time on different cameras are never grouped together", () => {
    const group = "cameras-2";
    const cameraA = "cameraA";
    const cameraB = "cameraB";
    cy.apiCreateGroupAndCameras(Penny, group, cameraA, cameraB);
    cy.uploadRecording(cameraA, { tags: ["possum"] });
    cy.uploadRecording(cameraB, { tags: ["cat"] });
    cy.checkMonitoring(Penny, null, [
      { camera: cameraA, tag: "possum" },
      { camera: cameraB, tag: "cat" }
    ]);
  });

  it("Station name should be recorded, and reported", () => {
    const group = "stations";
    const camera = "camera";
    cy.apiCreateGroupAndCameras(Penny, group, camera);

    const stations = [
      { name: "forest", lat: -44.0, lng: 172.7 },
      { name: "waterfall", lat: -43.6, lng: 172.8 }
    ];
    cy.apiUploadStations(Penny, group, stations);
    cy.uploadRecording(camera, { tags: ["possum"], lat: -44.0, lng: 172.7 });
    cy.uploadRecording(camera, { tags: ["cat"], lat: -44.0, lng: 172.7 });
    cy.checkMonitoring(Penny, camera, [{ station: "forest" }]);
  });

  it("If station changes the a new visit should be created", () => {
    const group = "stations-diff";
    const camera = "camera";
    cy.apiCreateGroupAndCameras(Penny, group, camera);

    const stations = [
      { name: "forest", lat: -44.0, lng: 172.7 },
      { name: "waterfall", lat: -43.6, lng: 172.8 }
    ];
    cy.apiUploadStations(Penny, group, stations);
    cy.uploadRecording(camera, { tags: ["possum"], lat: -44.0, lng: 172.7 });
    cy.uploadRecording(camera, { tags: ["cat"], lat: -43.6, lng: 172.8 });
    cy.checkMonitoring(Penny, camera, [
      { station: "forest" },
      { station: "waterfall" }
    ]);
  });
});
