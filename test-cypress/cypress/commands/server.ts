// load the global Cypress types
/// <reference types="cypress" />
export const DEFAULT_DATE = new Date(2021, 1, 16, 22);
import url = require("url");

export function apiPath(): string {
  return Cypress.env("cacophony-api-server");
}

export function v1ApiPath(page: string, queryParams: any = {}): string {
  const urlpage = url.format({
    pathname: `/api/v1/${page}`,
    query: queryParams
  });
  return `${Cypress.env("cacophony-api-server")}${urlpage}`;
}

interface ApiCreds {
  name: string;
  headers: {
    authorization: any;
  };
  jwt: string;
  id: number;
}

export function getCreds(userName: string): ApiCreds {
  return Cypress.env("testCreds")[userName];
}

export function saveCreds(response: Cypress.Response, name: string, id = 0) {
  const creds = {
    name,
    headers: {
      authorization: response.body.token
    },
    jwt: response.body.token,
    id
  };
  Cypress.env("testCreds")[name] = creds;
}

export function checkRequestFails(requestdetails: any) {
  // must set failOnStatusCode to false, to stop cypress from failing the test due to a failed status code before the then is called.
  requestdetails.failOnStatusCode = false;
  cy.request(requestdetails).then(
    (response) =>
      expect(
        response.isOkStatusCode,
        "Request should return a failure status code."
      ).to.be.false
  );
}

export function sendMultipartMessage(
  url: string,
  jwt: string,
  formData: any,
  onComplete: any
): void {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.setRequestHeader("authorization", jwt);
  xhr.responseType = "json";
  xhr.onload = function () {
    onComplete(xhr);
  };
  xhr.onerror = function () {
    onComplete(xhr);
  };
  xhr.send(formData);
}

// Uploads a file and data in a multipart message
// the file must be in the fixtures folder
export function uploadFile(
  url: string,
  credName: string,
  fileName: string,
  fileType: string,
  data: any
) {
  const jwt = getCreds(credName).jwt;

  // Get file from fixtures as binary
  cy.fixture(fileName, "binary").then((fileBinary) => {
    // File in binary format gets converted to blob so it can be sent as Form data
    const blob = Cypress.Blob.binaryStringToBlob(fileBinary, fileType);

    // Build up the form
    const formData = new FormData();
    formData.set("file", blob, fileName); //adding a file to the form
    formData.set("data", JSON.stringify(data));
    // Perform the request

    sendMultipartMessage(url, jwt, formData, function (xhr) {
      expect(xhr.status).to.eq(200);
    });
  });
}

type IsoFormattedDateString = string;
