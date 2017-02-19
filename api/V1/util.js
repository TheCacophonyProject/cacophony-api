var formidable = require('formidable');
var knox = require('knox');
var config = require('../../config.js');
var cmd = require('node-cmd');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var log = require('../../logging');
var path = require('path');

/**
 * Gets the query from the headers in the request.
 */
function getSequelizeQueryFromHeaders(req) {
  var query = {};
  var validData = true;
  var errMsgs = []; // Error messages when validating query.

  // Check that request has headers. If not return error.
  if (!req.headers) {
    errMsgs.push("No headers found in request.");
    return { error: true, errMsgs: errMsgs };
  }

  // Validate 'offset' field and add to query if it is valid.
  var offset = req.headers.offset;
  if (offset) {
    if (isNaN(offset)) {
      validData = false;
      errMsgs.push("Error: Field 'offset' in headers must be a number.");
    } else
      query.offset = parseInt(offset, 10);
  }

  // Validate 'limit' field and add to query if it is valid.
  var limit = req.headers.limit;
  if (limit) {
    if (isNaN(limit)) {
      validData = false;
      errMsgs.push("Error: Field 'limit' in headers must be a number.");
    } else
      query.limit = parseInt(limit, 10);
  }

  // Validate 'where' field and add to query if it is valid.
  var where = req.headers.where;
  if (where) {
    try {
      where = JSON.parse(where);
      query.where = where;
    } catch (err) {
      validData = false;
      errMsgs.push("Error: Could not parse 'where' field in headers to a JSON.");
    }
  } else {
    validData = false;
    errMsgs.push("Error: No 'where' field found in headers.");
  }

  if (!validData) return { error: true, errMsgs: errMsgs };
  else return query;
}


/**
 * Processes the POST request checking that the request is valid then saving the
 *  metadata in a sequelize model and uploading the file to the file storage.
 * @param {Object} model - Sequelize Model of the type of the recording.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Object} device - Sequelize model instnace of the Device that did the request.
 */

/**
 * Processes a http POST request and returns a JSON with the following fields.
 *  data: JSON object of the metadata.
 *  file: file of the recording.
 * If the request was invalid (could nto parse JSON...) a JSON object is
 *  returned with the following fields.
 *  errMsgs: Array of error messages.
 *  statusCode: HTTP status code to be used.
 * @param {Object} res - Express request object.
 * @return {Promise} resolves with a JSON Object.
 */
function fileAndDataFromPost(req) {
  return new Promise(function(resolve, reject) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
      errMsgs = [];

      // Check that form was parsed.
      if (err) {
        errMsgs.push("Error with parsing form.");
        log.err("Error with parsing form.", err.stack);
        return resolve({ statusCode: 400, errMsgs: errMsgs });
      }

      var validRequest = true;
      // Check that fields and files are valid.
      // Check that the 'data' field is a valid JSON.
      var data = fields.data;
      if (!data) {
        errMsgs.push("Error: Missing 'data' field in body.");
        log.warn("No 'data' field in request body.");
        validRequest = false;
      } else {
        try {
          data = JSON.parse(data);
        } catch (error) {
          errMsgs.push("Error: Could not parse 'data' field as a JSON.");
          log.warn("Could not parse 'data' from request.", {
            stack: error.stack,
            data: data,
          });
          validRequest = false;
        }
      }
      // Check that there is a 'file' field in file.
      //TODO check that this is an acceptabe file.
      var file = files.file;
      if (!file) {
        errMsgs.push("Error: No field 'file' found that is a file.");
        log.warn("No field 'file' in request that is a file.");
        validRequest = false;
      }

      // If invalid resolve the statusCode and error messages.
      if (!validRequest) {
        log.info("Bad request", { messages: errMsgs });
        return reject({ statusCode: 400, errMsgs: errMsgs });
      }

      // Resolve parsing the data and file.
      return resolve({ data: data, file: file });
    });
  });
}

function handleResponse(response, data) { //code, success, messages, err) {

  // Check that the data is valid.
  if (
    typeof data != 'object' ||
    typeof data.statusCode != 'number' ||
    typeof data.messages != 'object' ||
    typeof data.success != 'boolean'
  ) {
    // Responde with server error if data is invalid.
    return serverErrorResponse(response, data);
  }
  // Responde if data is valid.
  var statusCode = data.statusCode;
  delete data.statusCode;
  return response.status(statusCode).json(data);
}

function serverErrorResponse(response, err) {
  log.error(err.stack);
  return response.status(500).json({
    success: false,
    messages: ["Server error."]
  });
}

/**
 * Uploads the file to the S3 server.
 */
function uploadToS3(localPath, s3Path) {
  return new Promise(function(resolve, reject) {
    log.debug("Uploading file to S3.");
    knox.createClient({
      key: config.s3.publicKey,
      secret: config.s3.privateKey,
      bucket: config.s3.bucket,
      region: config.s3.region
    }).putFile(localPath, s3Path, function(err, res) {
      fs.unlink(localPath);
      if (err) {
        return reject(err);
      } else {
        return resolve(res);
      }
    });
  });
}


function s3PathFromDate(date) {
  if (!date) date = new Date();
  return date.getFullYear() + '/' + date.getMonth() + '/' +
    date.toISOString().replace(/\..+/, '') + '_' +
    Math.random().toString(36).substr(2);
}

function getDateFromMetadata(data) {
  // TODO try a few more things to get the date from the data if the datetime is not found.
  var date;
  try {
    date = new Date(data.recordingDateTime);
    date.toISOString(); //Check that date is a valid date. Will throw error if not.
  } catch (err) {
    //TODO log error
    return null;
  }
}

function convertVideo(file) {
  return new Promise(function(resolve, reject) {
    if (file.type != 'video/mp4') {
      var convertedVideoPath = file.path + '.mp4';
      ffmpeg(file.path)
        .output(convertedVideoPath)
        .on('end', function() {
          fs.unlink(file.path);
          resolve(convertedVideoPath);
        })
        .on('error', function(err) {
          fs.unlink(file.path);
          reject(err);
        })
        .run();
    } else {
      resolve(file.path);
    }
  });
}

function convertAudio(file) {
  return new Promise(function(resolve, reject) {
    if (file.type != 'audio/mp3') {
      var convertedAudioPath = file.path + '.mp3';
      ffmpeg(file.path)
        .output(convertedAudioPath)
        .on('end', function() {
          fs.unlink(file.path);
          resolve(convertedAudioPath);
        })
        .on('error', function(err) {
          fs.unlink(file.path);
          reject(err);
        })
        .run();
    } else {
      resolve(file.path);
    }
  });
}

function getRecordingsFromModel(model, request, response) {
  var queryParams = getSequelizeQueryFromHeaders(request);

  // Check if authorization by a JWT failed.
  if (!request.user && request.headers.authorization) {
    return handleResponse(response, {
      success: false,
      statusCode: 401,
      messages: ["Invalid JWT. login to get valid JWT or remove 'authorization' header to do an anonymous request."]
    });
  }

  // Chech that they validated as a user. Not a device.
  if (request.user.$modelOptions.name.singular != 'User') {
    return handleResponse(response, {
      success: false,
      statusCode: 401,
      messages: ["JWT was not from a user."]
    });
  }

  // Return HTTP 400 if error when getting query from headers.
  if (queryParams.error) {
    return handleResponse(response, {
      success: false,
      statusCode: 400,
      messages: queryParams.errMsgs
    });
  }

  // Request was valid. Now quering database.
  model.findAllWithUser(request.user, queryParams)
    .then(function(models) {
      var result = {};
      result.rows = [];
      result.limit = models.limit;
      result.offset = models.offset;
      result.count = models.count;
      for (var key in models.rows) result.rows.push(models.rows[key].getFrontendFields()); // Just save the fromt end fields for each model.
      return handleResponse(response, {
        success: true,
        statusCode: 200,
        messages: ["Successful request."],
        result: result
      });
    })
    .catch(function(err) {
      serverErrorResponse(response, err);
    });
}

/**
 * Processes the POST request checking that the request is valid then saving the
 *  metadata in a sequelize model and uploading the file to the file storage.
 * @param {Object} model - Sequelize Model of the type of the recording.
 * @param {Object} request - Express request object.
 * @param {Object} response - Express response object.
 * @param {Object} device - Sequelize model instnace of the Device that did the request.
 */
function addRecordingFromPost(model, request, response, device) {
  // Check that the POST request is comming from a Device, Not a user.
  if (device.$modelOptions.name.singular != 'Device') {
    log.warn("User tried to upload a recording. Must be a Device to upload.");
    return util.handleResponse(res, {
      success: false,
      statusCode: 401,
      messages: ["JWT was not from a device."]
    });
  }
  var m = model;  // Save model in a new variable so it isn't undefined after the promise.
  // Get file and data from post request.
  fileAndDataFromPost(request)
    .then(function(result) {
      // Responde with error messages if parsing failed.
      if (result.errMsgs) {
        return handleResponse(response, {
          success: false,
          statusCode: result.statusCode,
          messages: result.errMsgs
        });
      }
      // Successful parsing of file and data.
      var file = result.file;
      var data = result.data;
      var messages = [];
      var errMsgs = [];

      // Generate URL for recording file.
      // TODO add random string onto end.
      var date = getDateFromMetadata(data);
      var s3Path = s3PathFromDate(date) + path.extname(file.name);

      // Build model and save to database.
      var model = m.build(
        data, {
          fields: m.apiSettableFields // Limit what fields can be set by user.
        });

      model.setDataValue('DeviceId', device.id); // From JWT.
      model.setDataValue('GroupId', device.GroupId); // From JWT.
      if (typeof device.public == 'boolean')
        model.setDataValue('public', device.public);
      else
        model.setDataValue('public', false);

      // Save model to database.
      model.save()
        .then(function() {
          log.info("Successful recording POST.");
          messages.push("Thanks fo the recording");
          handleResponse(response, {
            success: true,
            statusCode: 200,
            messages: messages
          });
        })
        .catch(function(error) {
          serverErrorResponse(result, error);
        });

      // Process and upload file.
      model.processRecording(file)
        .then((processedRec) => uploadToS3(processedRec, s3Path))
        .then(function(res) {
          if (res.statusCode == 200) {
            log.debug("Uploaded recording.");
            model.uploadFileSuccess(res);
          } else {
            log.debug("Upload of a recording failed.");
            //model.uploadFileError(res); //TODO add
          }
        })
        .catch(function(error) {
          log.error("Error with saving recording.");
          log.error(error.stack);
          //model.uploadFileError(err); //TODO add
        });

    })
    .catch(function(error) { // Error when processing request.
      log.error("Error when processing a POST request.");
      serverErrorResponse(response, error);
    });
}

exports.convertAudio = convertAudio;
exports.convertVideo = convertVideo;
exports.uploadToS3 = uploadToS3;
exports.fileAndDataFromPost = fileAndDataFromPost;
exports.handleResponse = handleResponse;
exports.s3PathFromDate = s3PathFromDate;
exports.getDateFromMetadata = getDateFromMetadata;
exports.serverErrorResponse = serverErrorResponse;
exports.getSequelizeQueryFromHeaders = getSequelizeQueryFromHeaders;
exports.getRecordingsFromModel = getRecordingsFromModel;
exports.addRecordingFromPost = addRecordingFromPost;
