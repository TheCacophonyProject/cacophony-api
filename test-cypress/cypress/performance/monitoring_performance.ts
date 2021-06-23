/// <reference path="../support/index.d.ts" />

describe("Monitoring : times and recording groupings", () => {
  const Dexter = "Dexter";
  const group = "Monitoring_visits";
  const max_page_length = 100;

  before(() => {
    cy.apiCreateUserGroup(Dexter, group);
  });

  it("can handle maximum number of visits per page", () => {
    const camera = "visits-per-page";
    var visits = [];
    // add 1000 recordings
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:55", duration: 10 });
    for (let i = 0; i < max_page_length * 10 - 1; i++) {
      cy.uploadRecording(camera, { minsLater: 11 });
    }

    for (let i = 0; i < max_page_length; i++) {
      visits.push({ recordings: 1 });
    }

    const filter = { "page-size": max_page_length, page: 1 };
    //  check first page
    var t1 = performance.now();
    cy.checkMonitoringWithFilter(Dexter, camera, filter, visits);
    var t2 = performance.now();
    cy.log(`Page 1 load duration: ${t2 - t1} ms`);
    //  check last page
    const filter10 = { "page-size": max_page_length, page: 10 };
    cy.checkMonitoringWithFilter(Dexter, camera, filter10, visits);
    var t3 = performance.now();
    cy.log(`Page 10 load duration: ${t3 - t2} ms`);
    // check nothing beyond last page
    const filter11 = { "page-size": max_page_length, page: 11 };
    cy.checkMonitoringWithFilter(Dexter, camera, filter11, []);
    var t4 = performance.now();
    cy.log(`Page 11 load duration: ${t4 - t3} ms`);
  });

  it("applies max page length by default", () => {
    const camera = "default_page_size";
    var visits = [];
    // add 1 page plus 1 worth of recordings
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:55", duration: 10 });
    for (let i = 0; i < max_page_length; i++) {
      cy.uploadRecording(camera, { minsLater: 11 });
    }

    // expected visits on 1st page is array of max_page_length of visits
    for (let i = 0; i < max_page_length; i++) {
      visits.push({ recordings: 1 });
    }

    var visits2 = [{ recordings: 1 }];

    //check first page
    const filter = { "page-size": max_page_length, page: 1 };
    cy.checkMonitoringWithFilter(Dexter, camera, filter, visits);
    //check second page
    const filter2 = { "page-size": max_page_length, page: 2 };
    cy.checkMonitoringWithFilter(Dexter, camera, filter2, visits2);
  });

  it("can handle large number of recordings per visit", () => {
    const camera = "recordings-per-visit";
    // add 1000 recordings
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:55", duration: 10 });
    for (let i = 0; i < 999; i++) {
      cy.uploadRecording(camera, { minsLater: 9 });
    }

    var visits = [{ recordings: 1000 }];

    const filter = { page: 1 };
    var t1 = performance.now();
    cy.checkMonitoringWithFilter(Dexter, camera, filter, visits);
    var t2 = performance.now();
    cy.log(`Page 1 load duration: ${t2 - t1} ms`);
  });

  it("can handle large number of pages", () => {
    const camera = "pages";

    // add 1000 recordings
    cy.apiCreateCamera(camera, group);
    cy.uploadRecording(camera, { time: "20:55", duration: 10 });
    for (let i = 0; i < 999; i++) {
      cy.uploadRecording(camera, { minsLater: 11 });
    }

    var visits = [{ recordings: 1 }];

    //check first page
    const filter1 = { "page-size": 1, page: 1 };
    var t1 = performance.now();
    cy.checkMonitoringWithFilter(Dexter, camera, filter1, visits);
    var t2 = performance.now();
    cy.log(`Page 1 load duration: ${t2 - t1} ms`);

    //check last page
    const filter1000 = { "page-size": 1, page: 1000 };
    cy.checkMonitoringWithFilter(Dexter, camera, filter1000, visits);
    var t3 = performance.now();
    cy.log(`Page 1000 load duration: ${t3 - t2} ms`);

    //check nothing beyond last page
    const filter1001 = { "page-size": 1, page: 1001 };
    cy.checkMonitoringWithFilter(Dexter, camera, filter1001, []);
  });
});
