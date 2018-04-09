var models = require('../../models');
var responseUtil = require('./responseUtil');

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

  if (request.user !== undefined) {
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
  if (request.user !== undefined) {
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

exports.handleRecordingPOST = handleRecordingPOST;
