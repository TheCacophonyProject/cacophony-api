// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, getCreds, convertToDate } from "../server";
import { logTestDescription, prettyLog } from "../descriptions";

Cypress.Commands.add(
  "checkVisitTags",
  (user: string, camera: string, expectedTags: string[]) => {
    const expectedVisits = expectedTags.map((tag) => {
      return { tag };
    });

    logTestDescription(
      `Check visit tags match ${prettyLog(expectedTags)}`,
      {
        user,
        camera,
        expectedVisits
      }
    );

    checkVisitsMatch(user, camera, {}, expectedVisits);
  }
);

Cypress.Commands.add(
  "checkVisits",
  (user: string, camera: string, expectedVisits: ComparableVisit[]) => {
    logTestDescription(`Check visits match ${prettyLog(expectedVisits)}`, {
      user,
      camera,
      expectedVisits
    });

    checkVisitsMatch(user, camera, {}, expectedVisits);
  }
);

Cypress.Commands.add(
  "checkVisitsWithFilter",
  (user: string, camera: string, searchParams: VisitSearchParams, expectedVisits: ComparableVisit[]) => {
    logTestDescription(`Check visits match ${prettyLog(expectedVisits)} `, {
      user,
      camera,
      expectedVisits, 
      searchParams
    });

    if (searchParams.from) {
      searchParams.from = convertToDate(searchParams.from).toISOString();
    }

    if (searchParams.until) {
      searchParams.until = convertToDate(searchParams.until).toISOString();
    }

    checkVisitsMatch(user, camera , searchParams, expectedVisits);
  }
);

function checkVisitsMatch(
  user: string,
  camera: string,
  specialParams: VisitSearchParams,
  expectedVisits: ComparableVisit[]
) {
  
  const params : VisitSearchParams = {
    page: 1,
    "page-size": 100,
  };

  Object.assign(params, specialParams);

  if (camera) {
    params.devices = getCreds(camera).id;
  }

  cy.request({
    method: "GET",
    url: v1ApiPath("monitoring/page", params),
    headers: getCreds(user).headers
  }).then((response) => {
    checkResponseMatches(response, expectedVisits);
  });
}

function checkResponseMatches(
  response: Cypress.Response,
  expectedVisits: ComparableVisit[]
) {
  const responseVisits = response.body.result.results;

  expect(
    responseVisits.length,
    `Number of visits to be ${responseVisits.length}`
  ).to.eq(expectedVisits.length);
  // const increasingDateResponseVisits = responseVisits.reverse();
  const increasingDateResponseVisits = responseVisits;

  // pull out the bits we care about
  const responseVisitsToCompare: ComparableVisit[] = [];
  for (var i = 0; i < expectedVisits.length; i++) {
    const expectedVisit = expectedVisits[i];
    const completeResponseVisit = increasingDateResponseVisits[i];
    const simplifiedResponseVisit: ComparableVisit = {};

    if (expectedVisit.tag) {
      simplifiedResponseVisit.tag = completeResponseVisit.what || "<null>";
    }

    if (expectedVisit.recordings) {
      simplifiedResponseVisit.recordings =  completeResponseVisit.recordings.length;
    }

    if (expectedVisit.start) {
      if (expectedVisit.start instanceof Date) {
        // full date
        simplifiedResponseVisit.start = completeResponseVisit.start;
      } else {
        // just time
        simplifiedResponseVisit.start = new Date(completeResponseVisit.start).toTimeString().substring(0, 5);
      }
    }

    if (expectedVisit.end) {
      simplifiedResponseVisit.end = completeResponseVisit.end;
    }

    if (expectedVisit.incomplete) {
      simplifiedResponseVisit.incomplete = completeResponseVisit.incomplete.toString();
    }

    responseVisitsToCompare.push(simplifiedResponseVisit);
  }
  expect(JSON.stringify(responseVisitsToCompare)).to.eq(
    JSON.stringify(expectedVisits)
  );
}

interface VisitsWhere {
  type: string;
  duration?: any;
  DeviceId?: number;
}
