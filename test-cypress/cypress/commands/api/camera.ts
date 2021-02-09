import { should } from "chai";
import { getTestName } from "../names";
import { v1ApiPath, saveCreds, checkRequestFails} from "../server";


Cypress.Commands.add("apiCreateCamera", (cameraname: string, group: string) => {
  const request = createCameraDetails(cameraname, group)
  cy.request(request).then((response) => { saveCreds(response, cameraname); });  
});

Cypress.Commands.add("apiShouldFailToCreateCamera", (cameraname: string, group: string) => {
  const request = createCameraDetails(cameraname, group)
  checkRequestFails(request);
});

function createCameraDetails(cameraname: string, group: string, shouldFail = false): any {
  const fullName = getTestName(cameraname);
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
