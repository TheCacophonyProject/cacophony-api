import { randomBytes } from "crypto";

const uniqueIdName = "uniqueId";

export function getTestName(baseName) {
  initializeTestNames();

  return `cy_${baseName}_${Cypress.config("env")[uniqueIdName]}`;
}

export function initializeTestNames(uniqueId = "") {
  if (
    typeof Cypress.config("env") === "undefined" ||
    typeof Cypress.config("env")[uniqueIdName] === "undefined"
  ) {
    if (uniqueId.length < 1) {
      uniqueId = randomBytes(4).toString("hex");
    }

    cy.log(`Unique id for names for this run is '${uniqueId}'`);
    if (typeof Cypress.config("env") === "undefined") {
      Cypress.config("env", { uniqueIdName: uniqueId });
    }
    Cypress.config("env")[uniqueIdName] = uniqueId;
  }
}

export function stripBackName(testName: string) {
  const uniqueId = Cypress.config("env")[uniqueIdName];
  return testName.substring(3, testName.length - uniqueId.length - 1);
}
