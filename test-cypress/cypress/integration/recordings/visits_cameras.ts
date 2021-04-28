describe("Visits : multiple cameras and stations", () => {  
    const Penny = "Penny";
    
    before(() => {
        cy.apiCreateUser(Penny);
      });
      
    it("Recordings at the same time on different cameras are never grouped together", () => {
      const group = "cameras-2";
      const cameraA = "cameraA"
      const cameraB = "cameraB";
      cy.apiCreateGroup(Penny, group);
      cy.apiCreateCamera(cameraA, group);
      cy.apiCreateCamera(cameraB, group);
      cy.uploadRecording(cameraA, { tags: ["possum"] });
      cy.uploadRecording(cameraB, { tags: ["cat"] });
      cy.checkVisits(Penny, null, [{camera: cameraA, tag: "possum"}, {camera: cameraB, tag: "cat"}]);
    });
    
    it("Stations should be recorded, and reported", () => {
        const group = "stations";
        const camera = "camera"
        cy.apiCreateGroup(Penny, group);
        cy.apiCreateCamera(camera, group);
    
        const stations = [
            { name: "forest", lat: -44.0, lng: 172.7},
            { name: "waterfall", lat: -43.6, lng: 172.8}
          ];
        cy.apiUploadStations(Penny, group, stations);
        cy.uploadRecording(camera, { tags: ["possum"], lat: -44.0, lng: 172.7 });
        cy.uploadRecording(camera, { tags: ["cat"], lat: -44.0, lng: 172.7 });
        cy.checkVisits(Penny, camera, [{station: "forest"}]);
    });

    it("If station changes the a new visit should be created", () => {
        const group = "stations-diff";
        const camera = "camera"
        cy.apiCreateGroup(Penny, group);
        cy.apiCreateCamera(camera, group);
    
        const stations = [
            { name: "forest", lat: -44.0, lng: 172.7},
            { name: "waterfall", lat: -43.6, lng: 172.8}
          ];
        cy.apiUploadStations(Penny, group, stations);
        cy.uploadRecording(camera, { tags: ["possum"], lat: -44.0, lng: 172.7 });
        cy.uploadRecording(camera, { tags: ["cat"], lat: -43.6, lng: 172.8});
        cy.checkVisits(Penny, camera, [{station: "forest"}, {station: "waterfall"}]);
    })
});