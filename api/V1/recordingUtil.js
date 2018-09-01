/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const jsonwebtoken      = require('jsonwebtoken');
const mime             = require('mime');

const { ClientError }   = require('../customErrors');
const config            = require('../../config');
const models            = require('../../models');
const responseUtil      = require('./responseUtil');
const util              = require('./util');


function makeUploadHandler(mungeData) {
  return util.multipartUpload((request, data, key) => {
    if (mungeData) {
      data = mungeData(data);
    }

    const recording = models.Recording.build(data, {
      fields: models.Recording.apiSettableFields,
    });
    recording.set('rawFileKey', key);
    recording.set('rawMimeType', guessRawMimeType(data.type, data.filename));
    recording.set('DeviceId', request.device.id);
    recording.set('GroupId', request.device.GroupId);
    recording.set('processingState', models.Recording.processingStates[data.type][0]);
    if (typeof request.device.public === 'boolean') {
      recording.set('public', request.device.public);
    }
    return recording;
  });
}

// Returns a promise for the recordings query specified in the
// request.
function query(request, type) {
  if (request.query.tagMode == null) {
    request.query.tagMode = 'any';
  }
  if (!request.query.where) {
    request.query.where = {};
  }

  // remove legacy tag mode selector (if included)
  delete request.query.where._tagged;

  if (type) {
    request.query.where.type = type;
  }

  return models.Recording.query(
    request.user,
    request.query.where,
    request.query.tagMode,
    request.query.tags,
    request.query.offset,
    request.query.limit,
    request.query.order);
}

async function get(request, type) {
  const recording = await models.Recording.getOne(request.user, request.params.id, type);
  if (!recording) {
    throw new ClientError("No file found with given datapoint.");
  }

  const downloadFileData = {
    _type: 'fileDownload',
    key: recording.fileKey,
    filename: recording.getFileName(),
    mimeType: recording.fileMimeType,
  };

  const downloadRawData = {
    _type: 'fileDownload',
    key: recording.rawFileKey,
    filename: recording.getRawFileName(),
    mimeType: recording.rawMimeType,
  };
  delete recording.rawFileKey;

  return {
    recording: recording,
    cookedJWT: jsonwebtoken.sign(
      downloadFileData,
      config.server.passportSecret,
      { expiresIn: 60 * 10 }
    ),
    rawJWT: jsonwebtoken.sign(
      downloadRawData,
      config.server.passportSecret,
      { expiresIn: 60 * 10 }
    ),
  };
}

async function delete_(request, response) {
  var deleted = await models.Recording.deleteOne(request.user, request.params.id);
  if (deleted) {
    responseUtil.send(response, {
      statusCode: 200,
      success: true,
      messages: ["Deleted recording."],
    });
  } else {
    responseUtil.send(response, {
      statusCode: 400,
      success: false,
      messages: ["Failed to delete recording."],
    });
  }
}

function guessRawMimeType(type, filename) {
  var mimeType = mime.getType(filename);
  if (mimeType) {
    return mimeType;
  }
  switch (type) {
  case "thermalRaw":
    return "application/x-cptv";
  case "audio":
    return "audio/mpeg";
  default:
    return "application/octet-stream";
  }
}

async function addTag(request, response) {
  const recording = await models.Recording.findById(request.body.recordingId);
  if (!recording) {
    responseUtil.send(response, {
      statusCode: 400,
      success: false,
      messages: ['No such recording.']
    });
    return;
  }

  if (request.user) {
    const permissions = await recording.getUserPermissions(request.user);
    if (!permissions.canTag) {
      responseUtil.send(response, {
        statusCode: 400,
        success: false,
        messages: ['User does not have permission to tag recording.']
      });
      return;
    }
  }

  // Build tag instance
  const tagInstance = models.Tag.build(request.body.tag, {
    fields: models.Tag.apiSettableFields,
  });
  tagInstance.set('RecordingId', request.body.recordingId);
  if (request.user !== undefined) {
    tagInstance.set('taggerId', request.user.id);
  }
  await tagInstance.save();

  responseUtil.send(response, {
    statusCode: 200,
    success: true,
    messages: ['Added new tag.'],
    tagId: tagInstance.id,
  });
}

exports.makeUploadHandler = makeUploadHandler;
exports.query = query;
exports.get = get;
exports.delete_ = delete_;
exports.addTag = addTag;
