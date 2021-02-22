// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, getCreds } from "../server";
import { logTestDescription } from "../descriptions";

Cypress.Commands.add(
  "checkVisits",
  (user: string, camera: string, noVists: number) => {
    logTestDescription(`Check number of visits is ${noVists}`, {
      user: user,
      camera: camera,
      expectedVisits: noVists
    });

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

    const visitsNum = noVists;
    cy.request({
      method: "GET",
      url: v1ApiPath("recordings/visits", params),
      headers: getCreds(user).headers
    }).then((response) => {
      expect(response.body.numVisits).to.eq(visitsNum);
    });
  }
);

interface VisitsWhere {
  type: string;
  duration?: any;
  DeviceId?: number;
}
