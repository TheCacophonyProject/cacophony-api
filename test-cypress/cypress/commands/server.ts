// load the global Cypress types
/// <reference types="cypress" />

export function apiPath() : string {
   cy.log(Cypress.env('cacophony-api-server'));
   return Cypress.env('cacophony-api-server');
}

interface userCreds {
   jwt : any,
   username: string,
   headers: {
     'authorization': any
   }
}

export function getUserCreds(username: string) : userCreds {
   return Cypress.env('testUsers').username;
}

export function saveUserCreds(user : userCreds) {
   Cypress.env('testUsers')[user.username] = user;
}


