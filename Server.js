var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var path = require('path');
var winston = require('winston');
var AWS = require('aws-sdk');
var fs = require('fs');
var tcpPortUsed = require('tcp-port-used');
var http = require('http');
var https = require('https');

try {
  fs.statSync('./config/config.js');
} catch (error) {
  console.log("Config file is not setup. Read README.md for config setup.");
  return;
}
var config = require('./config/config');
var models = require('./models');
var log = require('./logging');

log.info('Starting Full Noise.');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
log.addExpressApp(app);

// Adding headers to allow cross-origin HTTP request.
// This is so the web interface running on a different port/domain can access the API.
// This could cause security issues with Cookies but JWTs are used instead of Cookies.
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

require('./api/V1')(app);
require('./router')(app);

log.info("Connecting to database.....");
models.sequelize
  .authenticate()
  .then(() => log.info("Connected to database."))
  .then(() => checkS3Connection())
  .then(() => openHttpServer(app))
  .then(() => openHttpsServer(app))
  .catch(function(error) {
    log.error(error);
  });

function openHttpsServer(app) {
  return new Promise(function(resolve, reject) {
    if (!config.server.https.active)
      return resolve();
    try {
      log.info('Starting https server on ', config.server.https.port);
      https.createServer(app).listen(config.server.https.port);
      return resolve();
    } catch (err) {
      return reject(err);
    }
  });
}

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
    var s3 = new AWS.S3({
      endpoint: config.leoFS.endpoint,
      accessKeyId: config.leoFS.publicKey,
      secretAccessKey: config.leoFS.privateKey,
    });
    var params = { Bucket: config.leoFS.bucket };
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
