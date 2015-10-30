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

var DataPoint = sequelize.define('data_point', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  device_id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  recording_rule_id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  location_id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  hardware_id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  software_id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  microphone_id: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    }
  },
  battery_level: {
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
  file_location: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  start_time_utc: {
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
  file_type: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  bit_rate: {
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
  user_location_input: {
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
  solar_panel_power: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  battery_size: {
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
  os_codename: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  os_incremental: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  sdk_int: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  os_release: {
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
  date_of_calibration: {
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
  local_tempreature: {
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
  local_rainfall: {
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
  local_humidity: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  light_level: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  local_light_level: {
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
  local_pressure: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  wind_direction: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  local_wind_direction: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  wind_magnitude: {
    type: Sequelize.INTEGER,
    defaultValue: null,
    validate: {
      isInt: true
    }
  },
  local_wind_mangitude: {
    type: Sequelize.BOOLEAN,
    defaultValue: null
  },
  weather_station: {
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

var RecordingRule = sequelize.define('recording_rule', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      isInt: true
    }
  },
  start_time_utc: {
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
