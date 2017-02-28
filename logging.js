var config = require('./config');
var winston = require('winston');
var expressWinston = require('express-winston');


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
      level: config.logger.level,
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

logger.addExpressApp = function(app) {
  // Routs to ignore logging.
  var ignoredRoutes = [
    "/stylesheets/bootstrapSubmenu.css",
    "/stylesheets/bootstrap.css",
    "/javascripts/util.js",
    "/javascripts/getAudioRecordings.js",
    "/javascripts/getRecordingLayout.js",
    "/javascripts/includes/navbar.js",
    "/stylesheets/bootstrap.css.map"
  ];

  app.use(expressWinston.logger({
    winstonInstance: logger.transports.info,
    ignoredRoutes: ignoredRoutes,
    meta: false,
    expressFormat: true,
    handleExceptions: true,
    humanReadableUnhandledException: true
  }));

  app.use(expressWinston.logger({
    transports: [new winston.transports.Console({ colorize: true, })],
    ignoredRoutes: ignoredRoutes,
    meta: false,
    expressFormat: true,
    handleExceptions: true,
    humanReadableUnhandledException: true
  }));

  app.use(expressWinston.errorLogger({
    transports: [
      new winston.transports.File({
        filename: 'logFiles/expressErrors.log'
      })
    ]
  }));
}

module.exports = logger;
