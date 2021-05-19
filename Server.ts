import { Application } from "express";
import express from "express";
import bodyParser from "body-parser";
import passport from "passport";
import process from "process";
import http from "http";
import config from "./config";
import models from "./models";
import log from "./logging";
import customErrors from "./api/customErrors";
import modelsUtil from "./models/util/util";
import api from "./api/V1";
import fileProcessingApi from "./api/fileProcessing";

log.info("Starting Full Noise.");
config.loadConfigFromArgs(true);

const app: Application = express();
app.use(bodyParser.urlencoded({ extended: false, limit: "2Mb" }));
app.use(bodyParser.json());
app.use(passport.initialize());
log.addExpressApp(app);

// Adding API documentation
app.use(express.static(__dirname + "/apidoc"));

// Adding headers to allow cross-origin HTTP request.
// This is so the web interface running on a different port/domain can access the API.
// This could cause security issues with Cookies but JWTs are used instead of Cookies.
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Methods",
    "PUT, GET, POST, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "where, offset, limit, Authorization, Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

api(app);
app.use(customErrors.errorHandler);

// Add file processing API.
const fileProcessingApp = express();
fileProcessingApp.use(bodyParser.urlencoded({ extended: false, limit: "2Mb" }));
fileProcessingApi(fileProcessingApp);
http.createServer(fileProcessingApp).listen(config.fileProcessing.port);
log.info("Starting file processing on", config.fileProcessing.port);
fileProcessingApp.use(customErrors.errorHandler);

log.info("Connecting to database.....");
models.sequelize
  .authenticate()
  .then(() => log.info("Connected to database."))
  .then(() => checkS3Connection())
  .then(() => openHttpServer(app))
  .catch(function (error) {
    log.error(error);
    process.exit(2);
  });

function openHttpServer(app): Promise<void> {
  return new Promise(function (resolve, reject) {
    if (!config.server.http.active) {
      return resolve();
    }
    try {
      log.info("Starting http server on ", config.server.http.port);
      http.createServer(app).listen(config.server.http.port);
      return resolve();
    } catch (err) {
      return reject(err);
    }
  });
}

// Returns a Promise that will reolve if it could connect to the S3 file storage
// and reject if connection failed.
function checkS3Connection(): Promise<void> {
  return new Promise(function (resolve, reject) {
    const s3 = modelsUtil.openS3();
    const params = { Bucket: config.s3.bucket };
    log.info("Connecting to S3.....");
    s3.headBucket(params, function (err) {
      if (err) {
        log.error("Error with connecting to S3.");
        return reject(err);
      }
      log.info("Connected to S3.");
      return resolve();
    });
  });
}
