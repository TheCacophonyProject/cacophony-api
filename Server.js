var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var path = require('path');
var winston = require('winston');
var fs = require('fs');
var tcpPortUsed = require('tcp-port-used');
var http = require('http');

var configPath = './config/app.js';
process.argv.forEach((val, index) => {
  if (index > 1) {
    if (val.toLowerCase().startsWith('--config=')) {
      configPath = val.split('=')[1];
    }
    else {
      var error = "Cannot parse '" + val + "'.  The only accepted parameter is --config=<path-to-config-file> ";
      throw error;
    }
  }
});

var config = require('./config');
config.loadConfig(configPath);

var modelsUtil = require('./models/util/util');
var log = require('./logging');
var models = require('./models');

log.info('Starting Full Noise.');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
log.addExpressApp(app);

// Adding API documentation
app.use(express.static(__dirname + '/apidoc'));

// Adding headers to allow cross-origin HTTP request.
// This is so the web interface running on a different port/domain can access the API.
// This could cause security issues with Cookies but JWTs are used instead of Cookies.
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'where, offset, limit, Authorization');
  next();
});

require('./api/V1')(app);

// Add file processing API.
var fileProcessingApp = express();
fileProcessingApp.use(bodyParser.urlencoded({ extended: false }));
require('./api/fileProcessing')(fileProcessingApp);
http.createServer(fileProcessingApp).listen(config.fileProcessing.port);
log.info('Starting file processing on', config.fileProcessing.port);

log.info("Connecting to database.....");
models.sequelize
  .authenticate()
  .then(() => log.info("Connected to database."))
  .then(() => checkS3Connection())
  .then(() => openHttpServer(app))
  .catch(function(error) {
    log.error(error);
  });

function openHttpServer(app) {
  return new Promise(function(resolve, reject) {
    if (!config.server.http.active)
      return resolve();
    try {
      log.info('Starting http server on ', config.server.http.port);
      http.createServer(app).listen(config.server.http.port);
      return resolve();
    } catch (err) {
      return reject(err);
    }
  });
}

// Returns a Promise that will reolve if it could connect to the S3 file storage
// and reject if connection failed.
function checkS3Connection() {
  return new Promise(function(resolve, reject) {
    var s3 = modelsUtil.openS3();
    var params = { Bucket: config.s3.bucket };
    log.info("Connecting to S3.....");
    s3.headBucket(params, function(err, data) {
      if (err) {
        log.error("Error with connecting to S3.");
        return reject(err);
      }
      log.info("Connected to S3.");
      return resolve();
    });
  });
}
