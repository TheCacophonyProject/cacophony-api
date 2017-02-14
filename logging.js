var config = require('./config');
var winston = require('winston');


var logger = new(winston.Logger)({
  transports: [
    new(winston.transports.File)({
      name: 'info',
      filename: 'logFiles/info.log',
      level: 'info'
    }),
    new(winston.transports.File)({
      name: 'debug',
      filename: 'logFiles/debug.log',
      level: 'debug'
    }),
    new(winston.transports.File)({
      name: 'error',
      filename: 'logFiles/error.log',
      level: 'error',
      handleExceptions: true,
      humanReadableUnhandledException: true
    }),
    new(winston.transports.Console)({
      name: 'console',
      level: 'debug',
      colorize: true,
      handleExceptions: true,
      humanReadableUnhandledException: true
    })
  ]
});

logger.handleExceptions(new winston.transports.File({
  filename: 'logFiles/exceptions.log'
}));

logger.logException = true;

module.exports = logger;
