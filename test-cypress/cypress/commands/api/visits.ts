// load the global Cypress types
/// <reference types="cypress" />

import {v1ApiPath, getCreds} from "../server";
import {logTestDescription} from "../descriptions"; 

Cypress.Commands.add("checkVisits", (user: string, noVists: number) => {
  logTestDescription(`Check visits match ${noVists}`, {
      user: user,
      expectedVisits: noVists,
  });

  const params = {
    where: JSON.stringify({
        duration : {"$gte":"0"},
        type:"thermalRaw",
    }),
    limit: 100
  };

  const visitsNum = noVists;
  cy.request({
    method: 'GET',
    url: v1ApiPath("recordings/visits", params),
    headers: getCreds(user).headers
  }).then((response) => {expect(response.body.numVisits).to.eq(visitsNum)});
});
