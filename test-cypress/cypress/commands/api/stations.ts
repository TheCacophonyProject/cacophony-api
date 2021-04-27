// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, makeAuthorizedRequest } from "../server";
import { logTestDescription, prettyLog } from "../descriptions";
import { getTestName } from "../names";
import { checkRecording } from "./recordings";

Cypress.Commands.add(
  "apiUploadStations",
  (user: string, group: string, stations: CreateStationData[], updateFrom? : Date) => {
    logTestDescription(
      `Add stations ${prettyLog(stations)} to group '${group}' `,
      { user, group, stations, updateFrom }
    );

    const actualGroup = getTestName(group);
    const body : {[key: string]: string} = {
      stations: JSON.stringify(stations)
    };
    if (updateFrom) {
      body["fromDate"] = updateFrom.toISOString();
    }

    makeAuthorizedRequest(
      {
        method: "POST",
        url: v1ApiPath(`groups/${actualGroup}/stations`),
        body
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
    checkStationIs(user, subject, station);
  });
    
Cypress.Commands.add("checkRecordingsStationIs", (user:string, station:string) => {
  checkStationIs(user, 0, station);
});

function checkStationIs(user:string, recId: number, station:string) {
  const text = station === "" ? "not assigned to a station" : `assigned to station '${station}'`;
  logTestDescription(`and check recording is ${text}`, {
    user,
  });
  checkRecording(user, recId, (recording => {
    if (recording.Station) {
      expect (recording.Station.name).equals(station); 
    }
    else {
      expect ("").equals(station);
    }
  }));
};
