var models = require('../../models');
var util = require('./util');
var responseUtil = require('./responseUtil');
var requestUtil = require('./requestUtil');

// This implements the POST handling for a recording tag. It exists
// here so that it can be shared between /api/v1/tags and
// /api/fileProcessing.
async function handleRecordingPOST(request, response) {
  if (!request.body.tag) {
    return responseUtil.send(response, {
      statusCode: 400,
      success: false,
      messages: ['Missing "tag" field.'],
    });
  }

  var recordingId = parseInt(request.body.recordingId);
  if (isNaN(recordingId)) {
    return responseUtil.send(response, {
      statusCode: 400,
      success: false,
      messages: ['"recordingId" field is missing or is not a number.']
    });
  }

  if (request.user !== null) {
    var recording = await models.Recording.findById(request.body.recordingId);
    var permissions = await recording.getUserPermissions(request.user);
    if (!permissions.canTag) {
      return responseUtil.send(response, {
        statusCode: 400,
        success: false,
        messages: ['User does not have permission to tag recording.']
      });
    }
  }

  // Build tag instance
  var tagInstance = models.Tag.build(JSON.parse(request.body.tag), {
    fields: models.Tag.apiSettableFields,
  });
  tagInstance.set('RecordingId', request.body.recordingId);
  if (request.user !== null) {
    tagInstance.set('taggerId', request.user.id);
  }
  await tagInstance.save();

  // Respond to user.
  return responseUtil.send(response, {
    statusCode: 200,
    success: true,
    messages: ['Added new tag.'],
    tagId: tagInstance.id,
  });
}

function add(modelClass, request, response) {
  if (!requestUtil.isFromAUser(request))
    return responseUtil.notFromAUser(response);

  var id = parseInt(request.params.id);
  if (!id)
    return responseUtil.invalidDataId(response);

  var tags = requestUtil.getTags(request);
  if (tags.badRequest)
    return responseUtil.invalidAddTag(response, tags.badRequest);

  modelClass
    .findAllWithUser(request.user, { where: { id: id } })
    .then((modelInstances) => {
      var modelInstance = modelInstances.rows[0];
      if (modelInstance === null || modelInstance === undefined)
        throw { badRequest: util.NO_DATAPOINT_FOUND };
      return modelInstance.addTags(tags);
    })
    .then(() => responseUtil.validAddTags(response))
    .catch((err) =>
      util.catchError(err, response, responseUtil.invalidAddTags)
    );
}

function remove(modelClass, request, response) {
  if (!requestUtil.isFromAUser(request))
    return responseUtil.notFromAUser(response);

  var id = parseInt(request.params.id);
  if (!id)
    return responseUtil.invalidDataId(response);

  var tagsIds = requestUtil.getTagsIds(request);
  if (tagsIds.badRequest)
    return responseUtil.invalidAddTag(response, tagsIds.badRequest);

  modelClass
    .findAllWithUser(request.user, { where: { id: id } })
    .then((modelInstances) => {
      var modelInstance = modelInstances.rows[0];
      if (modelInstance === null || modelInstance === undefined)
        throw { badRequest: util.NO_DATAPOINT_FOUND };
      return modelInstance.deleteTags(tagsIds);
    })
    .then(() => responseUtil.validDeleteTags(response))
    .catch((err) =>
      util.catchError(err, response, responseUtil.invalidDeleteTags)
    );
}

function get(modelClass, request, response) {
  if (!requestUtil.isFromAUser(request))
    return responseUtil.notFromAUser(response);

  var id = parseInt(request.params.id);
  if (!id)
    return responseUtil.invalidDataId(response);

  modelClass
    .findAllWithUser(request.user, { where: { id: id } })
    .then((modelInstances) => {
      var modelInstance = modelInstances.rows[0];
      if (modelInstance === null || modelInstance === undefined)
        throw { badRequest: util.NO_DATAPOINT_FOUND };
      responseUtil.validGetTags(response, modelInstance.get('tags'));
    })
    .catch((err) =>
      util.catchError(err, response, responseUtil.invalidGetTags)
    );
}

exports.handleRecordingPOST = handleRecordingPOST;
exports.add = add;
exports.remove = remove;
exports.get = get;
