// load the global Cypress types
/// <reference types="cypress" />

import { v1ApiPath, makeAuthorizedRequest } from "../server";

// Cypress.Commands.add(
//     "checkRecordings",
//     (user: string, camera: string, expected: ComparableRecording[]) => {
//       logTestDescription(`Check recordings match ${prettyLog(expected)}`, {
//         user,
//         camera,
//         expected
//       });

//       checkRecordingsMatch(user, camera, expected);
//     }
//   );

//   function checkRecordingsMatch(
//     user: string,
//     camera: string,
//     expectedRecordings: ComparableRecording[]
//   ) {

//     let params = camera ? {where: JSON.stringify({DeviceId: getCreds(camera).id})} : {};

//     makeAuthorizedRequest(
//         {
//             url: v1ApiPath("recordings", params),
//         },
//         user
//     ).then((response) => {
//       checkResponseMatches(response, expectedRecordings);
//     });
//   }

//   function checkResponseMatches(
//     response: Cypress.Response,
//     expected: ComparableRecording[]
//   ) {
//     const responseRecordings = response.body.rows;

//     expect(
//       responseRecordings.length,
//       `Number of recording expected to be ${responseRecordings.length}`
//     ).to.eq(expected.length);
//     const increasingDateResponseVisits = responseRecordings.reverse();

//     // pull out the bits we care about
//     const compares: ComparableRecording[] = [];
//     for (var i = 0; i < expected.length; i++) {
//       const expectedRec = expected[i];
//       const recToCompare = increasingDateResponseVisits[i];
//       const comparableRec: ComparableRecording = {};

//       if (expectedRec.station != null) {
//         comparableRec.station = (recToCompare.Station) ? recToCompare.Station.name : "";
//       }

//       compares.push(comparableRec);
//     }

//     expect(JSON.stringify(compares)).to.eq(
//       JSON.stringify(expected)
//     );
//   }

export function checkRecording(
  user: string,
  recordingId: number,
  checkFunction: any
) {
  cy.log(`recording id is ${recordingId}`);
  makeAuthorizedRequest(
    {
      url: v1ApiPath(`recordings`)
    },
    user
  ).then((response) => {
    let recordings = response.body.rows;
    if (recordingId !== 0) {
      recordings = recordings.filter((x) => x.id == recordingId);
    }
    if (recordings.length > 0) {
      checkFunction(recordings[0]);
    } else {
      expect(recordings.length).equal(1);
    }
  });
}
