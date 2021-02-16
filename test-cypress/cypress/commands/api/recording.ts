// load the global Cypress types
/// <reference types="cypress" />

import {v1ApiPath, getCreds } from "../server";

Cypress.Commands.add("uploadRecording", (cameraName: string, log = true) => {
  if (log) {
    cy.log(`Uploading a recording to '${cameraName}'`);
  }
  const fileName = 'small.cptv';
  const url = v1ApiPath('recordings');
  const fileType = 'application/cptv';
  const jwt = getCreds(cameraName).jwt;

  // Get file from fixtures as binary
  cy.fixture(fileName, 'binary').then( (excelBin) => {

      // File in binary format gets converted to blob so it can be sent as Form data
      const blob = Cypress.Blob.binaryStringToBlob(excelBin, fileType);

      const data = {"type": "thermalRaw", 
      "recordingDateTime": "2021-02-15T23:25:35.790965+00:00", 
      "duration": 10, 
      "comment": "hmmm", 
      "batteryLevel": 98, 
      "batteryCharging": "CHARGING", 
      "airplaneModeOn": false, 
      "version": "223", 
      "additionalMetadata": {"bar": "foo"} }

      // Build up the form
      const formData = new FormData();
      formData.set('file', blob, fileName); //adding a file to the form
      formData.set('data', JSON.stringify(data));
          // Perform the request

      // var id = 0;
      var id = 0;
      cy.form_request('POST', url, jwt, formData, function (response) { 
        expect(response.status).to.eq(200);
        id = response.response.recordingId;
      }).then(() => { cy.log(`id is ${id}`) });
    });
});

Cypress.Commands.add("addTestRecording", (cameraName: string, log = true) => {
  cy.uploadRecording(cameraName);
});

// Performs an XMLHttpRequest instead of a cy.request (able to send data as FormData - multipart/form-data)
Cypress.Commands.add('form_request', (method, url, jwt, formData, done) => {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.setRequestHeader("authorization", jwt);
  xhr.onload = function () {
      done(xhr);
  };
  xhr.onerror = function () {
      done(xhr);
  };
  xhr.send(formData);
});


// Cypress.Commands.add("uploadRecording", (cameraName: string, log = true) => {
//     if (log) {
//         cy.log(`Uploading a recording to '${cameraName}`);
//     }

//     const camera = getCreds(cameraName);

//     const data = {"type": "thermalRaw", 
//       "recordingDateTime": "2021-02-15T20:25:35.790965+00:00", 
//       "duration": 10, 
//       "comment": "hmmm", 
//       "batteryLevel": 98, 
//       "batteryCharging": "CHARGING", 
//       "airplaneModeOn": false, 
//       "version": "223", 
//       "additionalMetadata": {"bar": "foo"} }

//     const body = {
//       "data" : data,
//       "file" : "blah"
//     }

//     const boundary = makeBoundary();
//     cy.log(`boundary is ${boundary}`);

//     const headers = {
//       authorization: camera.headers.authorization,
//       "content-type": makeHeader(boundary)
//     };

//     cy.request({
//       method: 'POST', 
//       url:  v1ApiPath('recordings'), 
//       headers: headers,
//       body: makeBody(boundary, data, "blah")});

//   //   fetch(v1ApiPath('recordings'), {
//   //     body: formData,
//   //     headers: camera.headers,
//   //     method: "post",
//   // }).then();

function makeBoundary() : string {
  var boundary = '---------------------------';
  boundary += Math.floor(Math.random()*32768);
  boundary += Math.floor(Math.random()*32768);
  boundary += Math.floor(Math.random()*32768);
  return boundary;
}

function makeHeader(boundary: string) : string {
  return "multipart/form-data; boundary=" + boundary;
}

function makeBody(boundary: string, data : any, file: string) : string {
  var body = '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="';
  body += "file";
  body += '"\r\n\r\n';
  body += file;
  body += '\r\n'
  body = '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="';
  body += "data";
  body += '"\r\n\r\n';
  body += JSON.stringify(data);
  body += '\r\n'
  body += '--' + boundary + '--';
  return body;
};
