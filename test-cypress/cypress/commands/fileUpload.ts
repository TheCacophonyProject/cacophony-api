// load the global Cypress types
/// <reference types="cypress" />

import { Interception } from "cypress/types/net-stubbing";
import { v1ApiPath, getCreds } from "./server";


export function sendMultipartMessage (
    url: string,
    jwt: string,
    formData: any,
    waitOn: string,
    onComplete: any
  ): Cypress.Chainable<Interception> {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("authorization", jwt);
    xhr.responseType = "json";
    xhr.onload = function () {
      onComplete(xhr);
  
      // send request that cypress waits on to say request is completed.
      const completedXhr = new XMLHttpRequest();
      completedXhr.open("POST", v1ApiPath("uploadedFile"));
      completedXhr.send(JSON.stringify(xhr.response.body));
    };
    xhr.onerror = function () {
      onComplete(xhr);
    };
    xhr.send(formData);
    return cy.wait(waitOn);
  }
  
  // Uploads a file and data in a multipart message
  // the file must be in the fixtures folder
  export function uploadFile (
    url: string,
    credName: string,
    fileName: string,
    fileType: string,
    data: any,
    waitOn: string
  ) : Cypress.Chainable<Interception> {
    const jwt = getCreds(credName).jwt;
  
    // Get file from fixtures as binary
    return cy.fixture(fileName, "binary").then((fileBinary) => {
      // File in binary format gets converted to blob so it can be sent as Form data
      const blob = Cypress.Blob.binaryStringToBlob(fileBinary, fileType);
  
      // Build up the form
      const formData = new FormData();
      formData.set("file", blob, fileName); //adding a file to the form
      formData.set("data", JSON.stringify(data));
      // Perform the request
  
      return sendMultipartMessage(url, jwt, formData, waitOn, function (xhr) {
        Cypress.log({name: "Upload debug", displayName: "(upload)", message: url, consoleProps: () => { return {fileName, fileType, uploader: credName, data, response: xhr.response};}});
  
        if (xhr.status != 200) {
          expect(xhr.status, "Check response from uploading file").to.eq(200);
        }
      });
    });
  }
  
