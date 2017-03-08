var util = require('./util');
var responseUtil = require('./responseUtil');
var requestUtil = require('./requestUtil');

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
        throw { badRequest: NO_DATAPOINT_FOUND };
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
        throw { badRequest: NO_DATAPOINT_FOUND };
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
        throw { badRequest: NO_DATAPOINT_FOUND };
      responseUtil.validGetTags(response, modelInstance.get('tags'));
    })
    .catch((err) =>
      util.catchError(err, response, responseUtil.invalidGetTags)
    );
}

exports.add = add;
exports.remove = remove;
exports.get = get;
