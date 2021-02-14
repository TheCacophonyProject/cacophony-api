import { should } from "chai";
import { getTestName } from "../names";
import { v1ApiPath, saveCreds, checkRequestFails} from "../server";


Cypress.Commands.add("apiCreateCamera", (cameraName: string, group: string, log = true) => {
  if (log) {
    cy.log(`Create camera '${cameraName}' in group '${group}'`);
  }
  const request = createCameraDetails(cameraName, group)
  cy.request(request).then((response) => { saveCreds(response, cameraName); });  
});

Cypress.Commands.add("apiShouldFailToCreateCamera", (cameraName: string, group: string, log = true) => {
  cy.log(`Check fails to create camera '${cameraName}' in group '${group}`);
  const request = createCameraDetails(cameraName, group)
  checkRequestFails(request);
});

function createCameraDetails(cameraName: string, group: string, shouldFail = false): any {
  const fullName = getTestName(cameraName);
  const password = 'p' + fullName;
  
  const data = {
    devicename : fullName,
    password : password,
    group: getTestName(group),
  };

  return  {
      method: 'POST',
      url: v1ApiPath("devices"),
      body: data,
  };
};
