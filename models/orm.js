var Sequelize = require('sequelize');

var sequelize = new Sequelize('cacophony_metadata', 'test', 'pass', {
  host: '192.168.33.10',
  port: '5432',
  dialect: 'postgres',
  logging: false
});

var sequelizeInstanceMethods = {
  setFromJson: function(json) {
    var extra = {};
    for (var key in json) {
      if (json.hasOwnProperty(key)) {
        if (typeof this.dataValues[key] != 'undefined') {
          this.setDataValue(key, json[key]);
        } else {
          extra[key] = json[key];
        }
      }
    }
    this.setDataValue('extra', extra);
  }
};

var audioRecording = sequelize.define('audioRecording', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  audioFileId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  deviceId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  recordingRuleId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  locationId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  hardwareId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  softwareId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  microphoneId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  environmentId: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var device = sequelize.define('device', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  type: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var videoFile = sequelize.define('videoFile', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  uploadTimestamp: {
    type: Sequelize.DATE,
    defaultValue: null
  },
  fileLocation: {
    type: Sequelize.STRING,
    defaultValue: null,
    validate: {
      notNull: true
    }
  },
  startTimestamp: {
    type: Sequelize.DATE,
    defaultValue: null
  },
  duration: {
    type: Sequelize.INTEGER,
    defaultValue: null,
  },
  fileExtension: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  mimeType: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  videoBitrate: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  dimensionX: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  dimentionY: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  fps: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  size: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  audioChannels: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  audioSampleRate: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  audioBitrate: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var audioFile = sequelize.define('audiofile', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  uploadTimestamp: {
    type: Sequelize.DATE,
    defaultValue: null
  },
  fileLocation: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  startTimestamp: {
    type: Sequelize.DATE,
    defaultValue: null,
  },
  duration: {
    type: Sequelize.INTEGER,
    defaultValue: null,
  },
  fileExtension: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  mimeType: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  bitrate: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  size: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  sampleRate: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  channels: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});


var location = sequelize.define('location', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: null,
  },
  latitude: {
    type: Sequelize.FLOAT,
    defaultValue: null,
    validate: {
      isFloat: true
    }
  },
  longitude: {
    type: Sequelize.FLOAT,
    defaultValue: null,
    validate: {
      isFloat: true
    }
  },
  altitude: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  accuracy: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  userLocationInput: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {}
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {}
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var hardware = sequelize.define('hardware', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  manufacturer: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  model: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  brand: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  url: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  solarPanelPower: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  batterySize: {
    type: Sequelize.FLOAT,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});


var software = sequelize.define('software', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  osCodename: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  osIncremental: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  sdkInt: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  osRelease: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  version: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var microphone = sequelize.define('microphone', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  dateOfCalibration: {
    type: Sequelize.DATE,
    defaultValue: null,
  },
  type: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  name: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var environment = sequelize.define('environment', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  tempreature: {
    type: Sequelize.FLOAT,
    defaultValue: null,
    validate: {
      isFloat: true
    }
  },
  localTempreature: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  rainfall: {
    type: Sequelize.FLOAT,
    defaultValue: null,
    validate: {
      isFloat: true
    }
  },
  localRainfall: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  humidity: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  localHumidity: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  lightLevel: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  localLightLevel: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  pressure: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  localPressure: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  windDirection: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  localWindDirection: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  windMagnitude: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  localWindMangitude: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  weatherStation: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var recordingRule = sequelize.define('recordingule', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  startTimestamp: {
    type: Sequelize.DATE,
    defaultValue: null,
  },
  duration: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  name: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  tags: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

function getClassFromModel(model) {
  var singular = model.__options.name.singular;
  var plural = model.__options.name.plural;
  var error = false;
  modelClass = null;
  if (parentModel.name == singular || parentModel == plural) {
    modelClass = parentModel;
  }
  for (var i = 0; i < childModels.length; i++) {
    if (childModels[i].name == singular || childModels[i].name == plural) {
      if (modelClass) {
        log.error('More than one model have similar names');
        error = true;
      }
      modelClass = childModels[i];
    }
  }
  if (error) {
    return null;
  } else {
    return modelClass;
  }
}

function sync(){
  return sequelize.sync();
}

exports.sync = sync;
exports.getClassFromModel = getClassFromModel;

exports.audioRecording = audioRecording;
exports.device = device;
exports.videoFile = videoFile;
exports.audioFile = audioFile;
exports.location = location;
exports.hardware = hardware;
exports.software = software;
exports.microphone = microphone;
exports.environment = environment;
exports.recordingRule = recordingRule;
