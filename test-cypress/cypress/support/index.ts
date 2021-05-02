// load the global Cypress types
/// <reference types="cypress" />

import "../commands/api/user";
import "../commands/api/camera";
import "../commands/api/recording";
import "../commands/api/recordings";
import "../commands/api/monitoring";
import "../commands/api/stations";
import "../commands/api/events";

beforeEach(function () {
  // This runs before each test file, eg once per file.
  cy.intercept("POST", "recordings").as("addRecording");
});
