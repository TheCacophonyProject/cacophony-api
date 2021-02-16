// load the global Cypress types
/// <reference types="cypress" />

export function apiPath() : string {
   return Cypress.env('cacophony-api-server');
}

export function v1ApiPath(page: string) : string {
   return Cypress.env('cacophony-api-server') + "/api/v1/" + page;
}

interface apiCreds {
   name: string,
   headers: {
     'authorization': any
   },
   jwt: string
}

export function getCreds(username: string) : apiCreds {
   return Cypress.env('testCreds')[username];
}

export function saveCreds(response: Cypress.Response, name: string) {
   const creds = {
      name: name,
      headers: {
        'authorization': response.body.token
      },
      jwt: response.body.token
   }
   Cypress.env('testCreds')[name] = creds;
}

export function checkRequestFails(requestdetails: any) {
   requestdetails.failOnStatusCode = false;
   cy.request(requestdetails).then((response) => expect(response.isOkStatusCode, "Request should return a failure status code.").to.be.false);
}

