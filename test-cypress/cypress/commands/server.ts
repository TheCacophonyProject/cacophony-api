// load the global Cypress types
/// <reference types="cypress" />
export const DEFAULT_DATE = new Date(2021, 4, 9, 22);
import { format as urlFormat } from "url";

export function apiPath(): string {
  return Cypress.env("cacophony-api-server");
}

export function v1ApiPath(page: string, queryParams: any = {}): string {
  const urlpage = urlFormat({
    pathname: `/api/v1/${page}`,
    query: queryParams
  });
  return `${Cypress.env("cacophony-api-server")}${urlpage}`;
}

// time string should look like "21:09"
export function convertToDate(timeOrDate: Date | string): Date {
  if (timeOrDate instanceof Date) {
    return timeOrDate as Date;
  } else if (timeOrDate) {
    const parts = (timeOrDate as String).split(":");
    if (parts.length == 2) {
      const nums = parts.map((item) => parseInt(item));
      const date = new Date(DEFAULT_DATE);
      date.setHours(nums[0], nums[1]);
      return date;
    }
    return new Date(DEFAULT_DATE);
  }

  return null;
}

interface ApiCreds {
  name: string;
  headers: {
    authorization: any;
  };
  jwt: string;
  id: number;
}

export function saveIdOnly(name: string, id: number) {
  const creds = {
    name,
    headers: {
      authorization: ""
    },
    jwt: "",
    id
  };
  Cypress.env("testCreds")[name] = creds;
}

export function getCreds(userName: string): ApiCreds {
  return Cypress.env("testCreds")[userName];
}

export function saveCreds(response: Cypress.Response, name: string, id = 0) {
  const creds = {
    name,
    headers: {
      authorization: response.body.token
    },
    jwt: response.body.token,
    id
  };
  Cypress.env("testCreds")[name] = creds;
}

export function checkAuthorizedRequestFails(
  requestDetails: Partial<Cypress.RequestOptions>,
  credName: string
) {
  // must set failOnStatusCode to false, to stop cypress from failing the test due to a failed status code before the then is called.
  requestDetails.failOnStatusCode = false;
  makeAuthorizedRequest(requestDetails, credName).then(expectRequestHasFailed);
}

export function checkRequestFails(
  requestDetails: Partial<Cypress.RequestOptions>
) {
  // must set failOnStatusCode to false, to stop cypress from failing the test due to a failed status code before the then is called.
  requestDetails.failOnStatusCode = false;
  cy.request(requestDetails).then(expectRequestHasFailed);
}

export function makeAuthorizedRequest(
  requestDetails: Partial<Cypress.RequestOptions>,
  credName: string
): Cypress.Chainable<Cypress.Response> {
  const creds = getCreds(credName);
  requestDetails.headers = creds.headers;
  return cy.request(requestDetails);
}

function expectRequestHasFailed(response) {
  expect(
    response.isOkStatusCode,
    "Request should return a failure status code."
  ).to.be.false;
}

type IsoFormattedDateString = string;
