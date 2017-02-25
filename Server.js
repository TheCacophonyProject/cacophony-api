//var Sequelize = require('sequelize');
var models = require('./models');
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var config = require('./config');
var path = require('path');
var log = require('./logging');
var expressWinston = require('express-winston');
var winston = require('winston');

log.info('Starting Full Noise.');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(expressWinston.logger({
  winstonInstance: log.transports.info,
  ignoredRoutes: [
    "/stylesheets/bootstrapSubmenu.css",
    "/stylesheets/bootstrap.css",
    "/javascripts/util.js",
    "/javascripts/getAudioRecordings.js",
    "/javascripts/getRecordingLayout.js",
    "/javascripts/includes/navbar.js",
    "/stylesheets/bootstrap.css.map"
  ],
  meta: false,
  expressFormat: true,
  handleExceptions: true,
  humanReadableUnhandledException: true
}));

app.use(expressWinston.logger({
  transports: [new winston.transports.Console({ colorize: true, })],
  ignoredRoutes: [
    "/stylesheets/bootstrapSubmenu.css",
    "/stylesheets/bootstrap.css",
    "/javascripts/util.js",
    "/javascripts/getAudioRecordings.js",
    "/javascripts/getRecordingLayout.js",
    "/javascripts/includes/navbar.js",
    "/stylesheets/bootstrap.css.map"
  ],
  meta: false,
  expressFormat: true,
  handleExceptions: true,
  humanReadableUnhandledException: true
}));


app.use(passport.initialize());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

require('./api/V1')(app);
require('./router')(app);

app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.File({
      filename: 'logFiles/expressErrors.log'
    })
  ]
}));

log.info("Connecting to database.....");
models.sequelize.sync()
  .then(function() {
    log.info("Connected to database.");
    app.listen(config.server.port);
    log.info('Open on http://localhost:' + config.server.port);
  });
