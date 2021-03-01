import { getTestName } from "../names";
import { v1ApiPath, saveCreds, checkRequestFails } from "../server";
import { logTestDescription } from "../descriptions";

Cypress.Commands.add(
  "apiCreateCamera",
  (cameraName: string, group: string, log = true) => {
    logTestDescription(
      `Create camera '${cameraName}' in group '${group}'`,
      {
        camera: cameraName,
        group: group
      },
      log
    );

    const request = createCameraDetails(cameraName, group);
    cy.request(request).then((response) => {
      const id = response.body.id;
      saveCreds(response, cameraName, id);
    });
  }
);

Cypress.Commands.add(
  "apiShouldFailToCreateCamera",
  (cameraName: string, group: string, log = true) => {
    logTestDescription(
      `Check that user cannot create camera '${cameraName}' in group '${group}'`,
      {
        camera: cameraName,
        group: group
      },
      log
    );

    const request = createCameraDetails(cameraName, group);
    checkRequestFails(request);
  }
);

function createCameraDetails(
  cameraName: string,
  group: string,
  shouldFail = false
): any {
  const fullName = getTestName(cameraName);
  const password = "p" + fullName;

  const data = {
    devicename: fullName,
    password: password,
    group: getTestName(group)
  };

  return {
    method: "POST",
    url: v1ApiPath("devices"),
    body: data
  };
}
