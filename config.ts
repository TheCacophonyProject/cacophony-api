import path from "path";
import fs from "fs";
import process from "process";
// Set some default configuration
const server = {
  loggerLevel: "info"
};

const timeZone = "Pacific/Auckland";

let configPath = "./config/app.js";
process.argv.forEach((val, index) => {
  if (index > 1) {
    if (val.toLowerCase().startsWith("--config=")) {
      configPath = val.split("=")[1];
    } else {
      throw `Cannot parse '${val}'.  The only accepted parameter is --config=<path-to-config-file> `;
    }
  }
});

function loadConfig(configPath) {
  configPath = path.resolve(configPath);
  checkConfigFileExists(configPath);
  const config = require(configPath).default;
  checkDatabaseConfigAvailable(config);
  return config;
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

export default {
  timeZone,
  server,
  loadConfig,
  euaVersion: 3,
  ...loadConfig(configPath)
};
