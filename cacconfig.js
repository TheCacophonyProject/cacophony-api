var path = require('path');
var fs = require('fs');

function loadConfig(configDirPath) {
    console.log(`Looking for config files in directory "${path.resolve(configDirPath)}"`);

    checkConfigFileExists(configDirPath, 'config.js');
    exports.config = require(configDirPath + '/config');
      
    checkConfigFileExists(configDirPath, 'database.js');
    exports.database = require(configDirPath + '/database');
}

function checkConfigFileExists(configDir, filename) {
    try {
        var filePath = configDir + "/" + filename;
        fs.statSync(filePath)
    } catch (error) {
        var errorStr = "Config file " + path.resolve(filePath) + " is not setup. Read README.md for config setup.";
        throw errorStr;
    }
}
 

exports.loadConfig = loadConfig;

  