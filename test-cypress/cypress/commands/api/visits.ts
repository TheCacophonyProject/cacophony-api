// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, getCreds } from "../server";
import { logTestDescription } from "../descriptions";

Cypress.Commands.add(
  "checkVisitTags",
  (user: string, camera: string, expectedTags: string[]) => {
    const expectedVisits = expectedTags.map((tag) => {return {tag}});

    logTestDescription(`Check visit tags match ${JSON.stringify(expectedTags)}`, {
      user,
      camera,
      expectedVisits
    });

    checkVisitsMatch(user, camera, expectedVisits);
  }
);

Cypress.Commands.add(
  "checkVisits",
  (user: string, camera: string, expectedVisits: ComparableVisit[]) => {

    logTestDescription(`Check visits match ${JSON.stringify(expectedVisits)}`, {
      user,
      camera,
      expectedVisits
    });

    checkVisitsMatch(user, camera, expectedVisits);
  }
);


function checkVisitsMatch(user: string, camera: string, expectedVisits: ComparableVisit[]) {
  const where: VisitsWhere = {
    duration: { $gte: "0" },
    type: "thermalRaw"
  };

  if (camera) {
    where.DeviceId = getCreds(camera).id;
  }

  const params = {
    where: JSON.stringify(where),
    limit: 100
  };

  cy.request({
    method: "GET",
    url: v1ApiPath("recordings/visits", params),
    headers: getCreds(user).headers
  }).then((response) => {
    checkResponseMatches(response, expectedVisits);
  });
}

function checkResponseMatches(response: any, expectedVisits: ComparableVisit[]) {
  const responseVisits = response.body.visits;

  expect(responseVisits.length, `Number of visits to be ${responseVisits.length}`).to.eq(expectedVisits.length);
  const increasingDateResponseVisits = responseVisits.reverse();

  // pull out the bits we care about
  const responseVisitsToCompare: ComparableVisit[] = []
  for (var i = 0; i < expectedVisits.length; i++) {
    const expectedVisit = expectedVisits[i];
    const completeResponseVisit = increasingDateResponseVisits[i];
    const simplifiedResponseVisit : ComparableVisit = {}

    if (expectedVisit.tag) {
      simplifiedResponseVisit.tag = completeResponseVisit.what;
    }

    if (expectedVisit.recordings) {
      const recordingIds = completeResponseVisit.events.map((ev) =>  { return ev.recID });
      const uniqueRecordingIds = recordingIds.reduce((acc, recId) => { 
        if(!acc.includes(recId)) {
          acc.push(recId);
        }
        return acc;}, 
        []);
      simplifiedResponseVisit.recordings = uniqueRecordingIds.length;
    }
    
    if (expectedVisit.start) {
      simplifiedResponseVisit.start = completeResponseVisit.start;
    }

    if (expectedVisit.end) {
      simplifiedResponseVisit.end = completeResponseVisit.end;
    }

    responseVisitsToCompare.push(simplifiedResponseVisit);
  }
  expect(JSON.stringify(responseVisitsToCompare)).to.eq(JSON.stringify(expectedVisits));
}


interface VisitsWhere {
  type: string;
  duration?: any;
  DeviceId?: number;
}
