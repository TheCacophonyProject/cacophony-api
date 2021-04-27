// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, makeAuthorizedRequest } from "../server";
import { logTestDescription, prettyLog } from "../descriptions";
import { getTestName } from "../names";
import { checkRecording } from "./recording";

Cypress.Commands.add(
  "apiUploadStations",
  (user: string, group: string, stations: CreateStationData[]) => {
    logTestDescription(
      `Add stations ${prettyLog(stations)} to group ${group}`,
      { user, group, stations }
    );

    const actualGroup = getTestName(group);

    makeAuthorizedRequest(
      {
        method: "POST",
        url: v1ApiPath(`groups/${actualGroup}/stations`),
        body: { stations: JSON.stringify(stations) }
      },
      user
    );
  }
);

Cypress.Commands.add("apiCheckStations", (user: string, group: string) => {
  logTestDescription(`Check stations for group ${group}`, { user, group });

  const actualGroup = getTestName(group);

  makeAuthorizedRequest(
    {
      method: "GET",
      url: v1ApiPath(`groups/${actualGroup}/stations`)
    },
    user
  );
});

Cypress.Commands.add(
  "thenCheckStationIs",
  { prevSubject: true },
  (subject, user: string, station: string) => {
    const text = station === "" ? "not assigned to a station" : `assigned to station '${station}'`;
    const stationWithQuotes = ` '${station}'`;
    logTestDescription(`and check recording is ${text}`, {
      user,
    });
    checkRecording(user, subject, (recording => {
      if (recording.Station) {
        expect (recording.Station.name).equals(station); 
      }
      else {
        expect ("").equals(station);
      }
    })); 
});
