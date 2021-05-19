// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, getCreds, convertToDate } from "../server";
import { logTestDescription, prettyLog } from "../descriptions";
import { stripBackName } from "../names";

Cypress.Commands.add(
  "checkMonitoringTags",
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

    checkMonitoringMatches(user, camera, {}, expectedVisits);
  }
);

Cypress.Commands.add(
  "checkMonitoring",
  (user: string, camera: string, expectedVisits: ComparableVisit[], log = true) => {
    logTestDescription(`Check visits match ${prettyLog(expectedVisits)}`, {
      user,
      camera,
      expectedVisits
    }, log);

    checkMonitoringMatches(user, camera, {}, expectedVisits);
  }
);

Cypress.Commands.add(
  "checkMonitoringWithFilter",
  (user: string, camera: string, searchParams: VisitSearchParams, expectedVisits: ComparableVisit[]) => {
    logTestDescription(`Check monitoring visits with filter ${prettyLog(searchParams)} match ${prettyLog(expectedVisits)} `, {
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

    checkMonitoringMatches(user, camera , searchParams, expectedVisits);
  }
);

function checkMonitoringMatches(
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
  const responseVisits = response.body.visits;

  expect(
    responseVisits.length,
    `Number of visits is ${responseVisits.length}`
  ).to.be.equal(expectedVisits.length);
  const increasingDateResponseVisits = responseVisits.reverse();

  // pull out the bits we care about
  const responseVisitsToCompare: ComparableVisit[] = [];
  for (var i = 0; i < expectedVisits.length; i++) {
    const expectedVisit = expectedVisits[i];
    const completeResponseVisit = increasingDateResponseVisits[i];
    const simplifiedResponseVisit: ComparableVisit = {};

    if (expectedVisit.station) {
      simplifiedResponseVisit.station = completeResponseVisit.station;
    }

    if (expectedVisit.camera) {
      simplifiedResponseVisit.camera = stripBackName(completeResponseVisit.device);
    }

    if (expectedVisit.tag) {
      simplifiedResponseVisit.tag = completeResponseVisit.classification || "<none>";
    }

    if (expectedVisit.aiTag) {
      simplifiedResponseVisit.aiTag = completeResponseVisit.classificationAi || "<none>";
    }

    if (expectedVisit.recordings) {
      simplifiedResponseVisit.recordings =  completeResponseVisit.recordings.length;
    }

    if (expectedVisit.start) {
      if (expectedVisit.start instanceof Date) {
        // full date
        simplifiedResponseVisit.start = completeResponseVisit.timeStart;
      } else {
        // just time
        simplifiedResponseVisit.start = new Date(completeResponseVisit.timeStart).toTimeString().substring(0, 5);
      }
    }

    if (expectedVisit.end) {
      simplifiedResponseVisit.end = completeResponseVisit.timeEnd;
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
