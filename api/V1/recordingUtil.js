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

const { ClientError, AuthorizationError }   = require('../customErrors');
const config            = require('../../config');
const models            = require('../../models');
const responseUtil      = require('./responseUtil');
const util              = require('./util');
const log               = require('../../logging');


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
  if (!request.query.where) {
    request.query.where = {};
  }
  if (type) {
    request.query.where.type = type;
  }

  // remove legacy tag mode selector (if included)
  delete request.query.where._tagged;

  return models.Recording.query(
    request.user,
    request.query.where,
    request.query.tagMode,
    request.query.tags,
    request.query.offset,
    request.query.limit,
    request.query.order,
    request.query.filterOptions,
  );
}

async function get(request, type) {
  const recording = await models.Recording.get(
    request.user,
    request.params.id,
    models.Recording.Perms.VIEW,
    {
      type: type,
      filterOptions: request.query.filterOptions,
    }
  );
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
      messages: ["Deleted recording."],
    });
  } else {
    responseUtil.send(response, {
      statusCode: 400,
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
  const options = {include: [
    { model: models.Device, where: {}, attributes: ["devicename", "id"] },
  ]};
  const recording = await models.Recording.findByPk(request.body.recordingId, options);
  log.info(recording.type);
  if (!recording) {
    responseUtil.send(response, {
      statusCode: 400,
      messages: ['No such recording.']
    });
    return;
  }

  if (request.user) {
    const permissions = await recording.getUserPermissions(request.user);
    if (!permissions.includes(models.Recording.Perms.TAG)) {
      throw new AuthorizationError("The user does not have permission to add tags to this");
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
    messages: ['Added new tag.'],
    tagId: tagInstance.id,
  });
}

const statusCode = {
  Success: 1,
  Fail: 2,
  Both: 3,
};


// reprocessAll expects request.body.recordings to be a list of recording_ids
// will mark each recording to be reprocessed
async function reprocessAll(request, response) {
  const recordings =  request.body.recordings;
  var responseMessage = {
    statusCode: 200,
    messages: [],
    reprocessed: [],
    fail: [],
  };

  var status = 0;
  for (var i = 0; i < recordings.length; i++){
    var resp = await reprocessRecording(request.user, recordings[i]);
    if(resp.statusCode != 200){
      status = status | statusCode.Fail;
      responseMessage.messages.push(resp.messages[0]);
      responseMessage.statusCode = resp.statusCode;
      responseMessage.fail.push(resp.recordingId);

    }else{
      responseMessage.reprocessed.push(resp.recordingId);
      status = status | statusCode.Success;
    }
  }
  responseMessage.messages.splice(0,0,getReprocessMessage(status));
  responseUtil.send(response, responseMessage);
  return;
}

function getReprocessMessage(status){
  switch(status){
  case statusCode.Success:
    return "All recordings scheduled for reprocessing" ;
  case statusCode.Fail:
    return "Recordings could not be scheduled for reprocessing";
  case statusCode.Both:
    return "Some recordings could not be scheduled for reprocessing";
  default:
    return "";
  }
}

// reprocessRecording marks supplied recording_id for reprocessing,
// under supplied user privileges
async function reprocessRecording(user,recording_id){
  const recording = await models.Recording.get(
    user,
    recording_id,
    models.Recording.Perms.UPDATE,
  );

  if (!recording) {
    return {
      statusCode: 400,
      messages: ["No such recording: " + recording_id],
      recordingId: recording_id
    };
  }

  await recording.reprocess(user);

  return {
    statusCode: 200,
    messages: ['Recording scheduled for reprocessing'],
    recordingId : recording_id,
  };
}

// reprocess a recording defined by request.user and request.params.id
async function reprocess(request, response) {
  var responseInfo = await reprocessRecording(request.user, request.params.id);
  responseUtil.send(response, responseInfo);
}


exports.makeUploadHandler = makeUploadHandler;
exports.query = query;
exports.get = get;
exports.delete_ = delete_;
exports.addTag = addTag;
exports.reprocess = reprocess;
exports.reprocessAll = reprocessAll;
