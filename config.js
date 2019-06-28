const fs = require("fs");
const path = require("path");

// Set some default configuration
const server = {
  loggerLevel: "info"
};

function loadConfig(configPath) {
  configPath = path.resolve(configPath);
  checkConfigFileExists(configPath);

  const config = require(configPath);
  for (const key in config) {
    exports[key] = config[key];
  }

  checkDatabaseConfigAvailable(config);

  return exports;
}

function checkConfigFileExists(configPath) {
  if (!fs.existsSync(configPath)) {
    throw "Config file " +
      configPath +
      " does not exist. See README.md for config setup. " +
      "NB: The default config file has been renamed to ./config/app.js";
  }
}

function checkDatabaseConfigAvailable(config) {
  if (!("database" in config)) {
    throw "Could not find database configuration. database.js has been merged into app.js";
  }
}

exports.loadConfig = loadConfig;
exports.server = server;
