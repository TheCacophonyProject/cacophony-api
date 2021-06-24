// load the global Cypress types
/// <reference types="cypress" />

import { getTestName } from "../names";
import {
  apiPath,
  getCreds,
  makeAuthorizedRequest,
  saveCreds,
  saveIdOnly,
  v1ApiPath
} from "../server";
import { logTestDescription, prettyLog } from "../descriptions";

Cypress.Commands.add("apiCreateUser", (userName: string, log = true) => {
  logTestDescription(`Create user '${userName}'`, { user: userName }, log);

  const usersUrl = apiPath() + "/api/v1/users";

  const fullName = getTestName(userName);
  const password = "p" + fullName;

  const data = {
    username: fullName,
    password: password,
    email: fullName + "@api.created.com"
  };

  cy.request("POST", usersUrl, data).then((response) => {
    saveCreds(response, userName);
  });
});

Cypress.Commands.add("apiSignInAs", (userName: string) => {
  const usersUrl = apiPath() + "/authenticate_user";

  const fullName = getTestName(userName);
  const password = "p" + fullName;

  const data = {
    username: fullName,
    password: password
  };

  cy.request("POST", usersUrl, data).then((response) => {
    saveCreds(response, userName);
  });
});

Cypress.Commands.add(
  "apiCreateGroup",
  (userName: string, group: string, log = true) => {
    logTestDescription(
      `Create group '${group}' for user '${userName}'`,
      { user: userName, group: group },
      log
    );

    makeAuthorizedRequest(
      {
        method: "POST",
        url: v1ApiPath("groups"),
        body: { groupname: getTestName(group) }
      },
      userName
    ).then((response) => {
      saveIdOnly(group, response.body.groupId);
    });
  }
);

Cypress.Commands.add(
  "apiCreateUserGroupAndCamera",
  (userName, group, camera) => {
    logTestDescription(
      `Create user '${userName}' with camera '${camera}' in group '${group}'`,
      { user: userName, group: group, camera: camera }
    );
    cy.apiCreateUser(userName, false);
    cy.apiCreateGroup(userName, group, false);
    cy.apiCreateCamera(camera, group, false);
  }
);

Cypress.Commands.add("apiCreateUserGroup", (userName, group) => {
  logTestDescription(`Create user '${userName}' with group '${group}'`, {
    user: userName,
    group: group
  });
  cy.apiCreateUser(userName, false);
  cy.apiCreateGroup(userName, group, false);
});

Cypress.Commands.add(
  "apiCreateGroupAndCameras",
  (userName, group, ...cameras) => {
    logTestDescription(
      `Create group '${group}' with cameras '${prettyLog(cameras)}'`,
      {
        user: userName,
        group,
        cameras
      }
    );
    cy.apiCreateGroup(userName, group, false);
    cameras.forEach((camera) => {
      cy.apiCreateCamera(camera, group);
    });
  }
);

Cypress.Commands.add(
  "apiAddUserToGroup",
  (
    groupAdminUser: string,
    userName: string,
    group: string,
    admin = false,
    log = true
  ) => {
    const adminStr = admin ? " as admin " : "";
    logTestDescription(
      `${groupAdminUser} Adding user '${userName}' ${adminStr} to group '${group}' ${
        admin ? "as admin" : ""
      }`,
      { user: userName, group, isAdmin: admin },
      log
    );

    makeAuthorizedRequest(
      {
        method: "POST",
        url: v1ApiPath("groups/users"),
        body: {
          group: getTestName(group),
          admin: admin.toString(),
          username: getTestName(userName)
        }
      },
      groupAdminUser
    );
  }
);

Cypress.Commands.add(
  "apiAddUserToDevice",
  (deviceAdminUser: string, userName: string, device: string) => {
    logTestDescription(
      `${deviceAdminUser} Adding user '${userName}' to device '${device}'`,
      { user: userName, device }
    );

    makeAuthorizedRequest(
      {
        method: "POST",
        url: v1ApiPath("devices/users"),
        body: {
          deviceId: getCreds(device).id,
          admin: "false",
          username: getTestName(userName)
        }
      },
      deviceAdminUser
    );
  }
);
