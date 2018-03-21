var path = require('path');
var fs = require('fs');

function loadConfig(configDirPath) {
    console.log(`Looking for config files in directory "${path.resolve(configDirPath)}"`);

    checkConfigFileExists(configDirPath, 'app.js');
    
    var config = require(configDirPath + '/app');

    for (var key in config) {
        exports[key] = config[key];
    }

    testDatabaseConfigAvailable(config);

    return exports;
}

function checkConfigFileExists(configDir, filename) {
    try {
        var filePath = configDir + "/" + filename;
        fs.statSync(filePath)
    } catch (error) {
        var errorStr = "Config file " + path.resolve(filePath) + " is not setup. See README.md for config setup. (NB.  Config file has been renamed to app.js)";
        throw errorStr;
    }
}

function testDatabaseConfigAvailable(config) {
    if (!('database' in config)) {
        throw "Could not find database configuration.  Database.js has been merged into app.js"
    }
}
 
exports.loadConfig = loadConfig;

  