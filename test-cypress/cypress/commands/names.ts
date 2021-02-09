import crypto = require("crypto");

const uniqueIdName = "uniqueId";

export function getTestName(baseName) {
  initializeTestNames();

  return "cypress_" + baseName + Cypress.config("env")[uniqueIdName];
}

export function initializeTestNames(uniqueId = "") {
  if (typeof Cypress.config("env") === 'undefined' || 
      typeof Cypress.config("env")[uniqueIdName] === 'undefined')  {
    if (uniqueId.length < 1) {
      uniqueId =  crypto.randomBytes(4).toString('hex');
    }

    if (typeof Cypress.config("env") === 'undefined') {
      Cypress.config("env", { uniqueIdName : uniqueId});
    }
    Cypress.config("env")[uniqueIdName] = uniqueId;
  }
}
