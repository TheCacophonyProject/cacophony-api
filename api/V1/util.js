var formidable = require('formidable');
var knox = require('knox');
var config = require('../../config.js');
var cmd = require('node-cmd');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
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
      query.offset = offset;
  }

  // Validate 'limit' field and add to query if it is valid.
  var limit = req.headers.limit;
  if (limit) {
    if (isNaN(limit)) {
      validData = false;
      errMsgs.push("Error: Field 'limit' in headers must be a number.");
    } else
      query.limit = limit;
  }

  // Validate 'where' field and add to query if it is valid.
  var where = req.headers.where;
  if (where) {
    try {
      where = JSON.parse(where);
      query.where = where;
    } catch (err) {
      validData = false;
      errMsgs.push("Error: Could not parse 'where' field in headers to a JSON.")
    }
  } else {
    validData = false;
    errMsgs.push("Error: No 'where' field found in headers.")
  }

  if (!validData) return { error: true, errMsgs: errMsgs };
  else return query;
}

function fileAndDataFromPost(req) {
  return new Promise(function(resolve, reject) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
      errMsgs = [];
      if (err) {
        errMsgs.push("Error with parsing form."); //TODO pull error message from err.
        return reject({ statusCode: 400, messages: errMsgs, success: false });
      }

      var validRequest = true;
      // Check that fields and files are valid.
      // Check that the 'data' field is a valid JSON.
      var data = fields.data;
      if (!data) {
        errMsgs.push("Error: Missing 'data' field in body.");
        validRequest = false;
      } else {
        try {
          data = JSON.parse(data);
        } catch (err) {
          errMsgs.push("Error: Could not parse 'data' field as a JSON.");
          validRequest = false;
        }
      }
      // Check that there is a 'file' field in file.
      //TODO check that this is an acceptabe file.
      var file = files.file;
      if (!file) {
        errMsgs.push("Error: No field 'file' found that is a file.");
        validRequest = false;
      }

      // Reject if bad request.
      if (!validRequest)
        return reject({ statusCode: 400, messages: errMsgs, success: false });

      // Resolve parsing the data and file.
      return resolve({ data: data, file: file });
    })
  })
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
    return serverErrorResponse(response, data)
  }
  // Responde if data is valid.
  var statusCode = data.statusCode;
  delete data.statusCode;
  return response.status(statusCode).json(data);
}

function serverErrorResponse(response, err) {
  //TODO log this error.
  console.log(err);
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
    console.log("Uploading.");
    knox.createClient({
      key: config.s3.publicKey,
      secret: config.s3.privateKey,
      bucket: config.s3.bucket,
      region: config.s3.region
    }).putFile(localPath, s3Path, function(err, res) {
      if (err) {
        return reject(err);
      } else {
        return resolve(res);
      }
    })
  })
}


function s3PathFromDate(date) {
  if (!date) date = new Date();
  return date.getFullYear() + '/' + date.getMonth() + '/' +
    date.toISOString().replace(/\..+/, '') + '_' +
    Math.random().toString(36).substr(2)
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
      .on('end', function() { resolve(convertedVideoPath) })
      .on('error', function(err) { reject(err) })
      .run();
    } else {
      resolve();
    }
  })
}

function convertAudio(file) {
  return new Promise(function(resolve, reject) {
    if (file.type != 'audio/mp3') {
      var convertedAudioPath = file.path + '.mp3';
      ffmpeg(file.path)
        .output(convertedAudioPath)
        .on('end', function() { resolve(convertedAudioPath); })
        .on('error', function(err) { reject(err); })
        .run();
    } else {
      resolve();
    }
  })
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
