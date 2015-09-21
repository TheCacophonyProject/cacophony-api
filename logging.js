var config = require('./config'),
  winston = require('winston');

winston.level = config.logger.level;
winston.cli();

module.exports = winston;
