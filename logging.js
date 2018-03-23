var config = require('./config');
var winston = require('winston');
var expressWinston = require('express-winston');

var consoleTransport = new(winston.transports.Console)({
  name: 'console',
  level: config.server.loggerLevel,
  colorize: true,
  handleExceptions: true,
  humanReadableUnhandledException: true
});

var logger = new(winston.Logger)({
  transports: [consoleTransport],
});

logger.addExpressApp = function(app) {
  app.use(expressWinston.logger({
    transports: [consoleTransport],
    meta: false,
    expressFormat: true,
  }));
};

module.exports = logger;
