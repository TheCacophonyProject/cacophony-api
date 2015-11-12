var Sequelize = require('sequelize'),
  config = require('./config'),
  log = require('./logging');

var sequelize = new Sequelize(config.db.name, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: config.db.logging
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

var DataPoint = sequelize.define('dataPoint', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  deviceId: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  recordingRuleId: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  locationId: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  hardwareId: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  softwareId: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  microphoneId: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  batteryLevel: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
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

var Device = sequelize.define('device', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
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

var Recording = sequelize.define('recording', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  fileLocation: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  startTimeUtc: {
    type: Sequelize.BIGINT,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  duration: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  fileType: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  bitRate: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  size: {
    type: Sequelize.INTEGER,
    defaultValue: null
  },
  extra: {
    type: Sequelize.JSON,
    defaultValue: {},
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});


var Location = sequelize.define('location', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  utc: {
    type: Sequelize.BIGINT,
    defaultValue: null,
    validate: {
      isInt: true
    }
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
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var Hardware = sequelize.define('hardware', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
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
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var Software = sequelize.define('software', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
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
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var Microphone = sequelize.define('microphone', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
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

var Environment = sequelize.define('environment', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
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
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var RecordingRule = sequelize.define('recordingule', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  startTimeUtc: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
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
  }
}, {
  instanceMethods: sequelizeInstanceMethods
});

var parentModel = DataPoint;
var childModels = [Device, Recording, Location, Hardware, Software, Microphone, Environment, RecordingRule];

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
exports.childModels = childModels;
exports.parentModel = parentModel;
exports.getClassFromModel = getClassFromModel;
