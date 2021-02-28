// load the global Cypress types
/// <reference types="cypress" />
export const DEFAULT_DATE = new Date(2021, 1, 16, 22);
import url = require("url");

export function apiPath(): string {
  return Cypress.env("cacophony-api-server");
}

export function v1ApiPath(page: string, queryParams: any = {}): string {
  const urlpage = url.format({
    pathname: `/api/v1/${page}`,
    query: queryParams
  });
  return `${Cypress.env("cacophony-api-server")}${urlpage}`;
}

interface ApiCreds {
  name: string;
  headers: {
    authorization: any;
  };
  jwt: string;
  id: number;
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

export function checkRequestFails(requestdetails: any) {
  // must set failOnStatusCode to false, to stop cypress from failing the test due to a failed status code before the then is called.
  requestdetails.failOnStatusCode = false;
  cy.request(requestdetails).then(
    (response) =>
      expect(
        response.isOkStatusCode,
        "Request should return a failure status code."
      ).to.be.false
  );
}

export function makeAuthorizedRequest(requestDetails: Partial<Cypress.RequestOptions>, credName: string): Cypress.Chainable<Cypress.Response> {
  const creds = getCreds(credName); 
  requestDetails.headers = creds.headers;
  return cy.request(requestDetails);
}


type IsoFormattedDateString = string;
