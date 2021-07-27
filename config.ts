import path from "path";
import fs from "fs";
import process from "process";
// Set some default configuration
const server = {
  loggerLevel: "info"
};

const timeZone = "Pacific/Auckland";

function loadConfigFromArgs(strict: boolean = false) {
  return loadConfig(getConfigPathFromArgs(strict));
}

function getConfigPathFromArgs(strict: boolean = false): string {
  let configPath = "./config/app.js";
  for (let i = 2; i < process.argv.length; i++) {
    const val = process.argv[i];
    if (val.startsWith("--config=")) {
      configPath = val.split("=")[1];
    } else if (val == "--config") {
      i++;
      configPath = process.argv[i];
    } else if (strict) {
      throw new Error(
        `Cannot parse '${val}'.  The only accepted parameter is --config=<path-to-config-file>`
      );
    }
  }
  return configPath;
}

function loadConfig(configPath) {
  configPath = path.resolve(__dirname, configPath);
  checkConfigFileExists(configPath);
  const config = require(configPath).default;
  checkDatabaseConfigAvailable(config);
  return config;
}

function checkConfigFileExists(configPath) {
  if (!fs.existsSync(configPath)) {
    throw (
      "Config file " +
      configPath +
      " does not exist. See README.md for config setup. " +
      "NB: The default config file has been renamed to ./config/app.js"
    );
  }
}

function checkDatabaseConfigAvailable(config) {
  if (!("database" in config)) {
    throw "Could not find database configuration. database.js has been merged into app.js";
  }
}

export default {
  getConfigPathFromArgs,
  loadConfigFromArgs,
  loadConfig,
  timeZone,
  server,
  euaVersion: 3,
  ...loadConfigFromArgs()
};
