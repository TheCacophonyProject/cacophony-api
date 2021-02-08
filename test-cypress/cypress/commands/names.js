const crypto = require("crypto");

const uniqueIdName = "uniqueId";

function getTestName(baseName) {
  initializeTestNames('ea2b51d6');

  return "cypress_" + baseName + Cypress.config(uniqueIdName);
}

function initializeTestNames(uniqueId = "") {
  if (typeof Cypress.config(uniqueIdName) === 'undefined') {
    if (uniqueId.length < 1) {
      uniqueId =  crypto.randomBytes(4).toString('hex');
    }
    Cypress.config(uniqueIdName, uniqueId);
    Cypress.config("apiClients", {});
    Cypress.config("devices", {});
  }
}

exports.getTestName = getTestName;
exports.initializeTestNames = initializeTestNames;
