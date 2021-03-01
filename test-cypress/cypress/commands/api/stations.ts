// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, makeAuthorizedRequest } from "../server";
import { logTestDescription } from "../descriptions";
import { getTestName } from "../names";

Cypress.Commands.add(
  "apiUploadStations",
  (user: string, group: string, stations: CreateStationData[]) => {

    logTestDescription(`Add stations ${JSON.stringify(stations)} to group ${group}`, {user, group, stations});

    const actualGroup = getTestName(group);

    makeAuthorizedRequest({
        method: "POST",
        url: v1ApiPath(`groups/${actualGroup}/stations`),
        body: { stations: JSON.stringify(stations) }
    }, user);
  }
);