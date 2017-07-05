var models = require('../../models');
var util = require('./util');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var responseUtil = require('./responseUtil');
var passport = require('passport');
var requestUtil = require('./requestUtil');
var responseUtil = require('./responseUtil');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/tags';

  app.post(apiUrl, passport.authenticate(['jwt'], { session: false }),
    async function(req, res) {

      // Check that authentication was from a user not a device.
      if (req.user !== null && !requestUtil.isFromAUser(req))
        return responseUtil.notFromAUser(response);

      // Check that the required fields are given.
      if (!req.body.tag) {
        return responseUtil.send(res, {
          statusCode: 400,
          success: false,
          messages: ['Missing "tag" field.'],
        });
      }
      if (!req.body.thermalVideoId &&
        !req.body.irVideoId &&
        !req.body.audioId) {
        return responseUtil.send(res, {
          statusCode: 400,
          success: false,
          messages: [
            'Missing "thermalVideoId" or "irVideoId" or "audioId"'
          ],
        });
      }

      // Chech that the user has required permission to tag recordings.
      var canEditCheckPromises = [];
      if (req.body.thermalVideoId)
        canEditCheckPromises.push(models.ThermalVideoRecording.userCanEdit(
          req.body.thermalVideoId, req.user))

      if (req.body.irVideoId)
        canEditCheckPromises.push(models.IrVideoRecording.userCanEdit(
          req.body.irVideoId, req.user))

      if (req.body.audioId)
        canEditCheckPromises.push(models.AudioRecording.userCanEdit(
          req.body.audioId, req.user))

      var canEditCheck = await Promise.all(canEditCheckPromises);
      for (i in canEditCheck) {
        if (canEditCheck[i] !== true)
          return responseUtil.send(res, {
            success: false,
            statusCode: 400,
            messages: [
              'User does not have premission to edit recording.'
            ]
          });
      }


      // Build tag instance
      tagInstance = models.Tag.build(JSON.parse(req.body.tag), {
        fields: models.Tag.apiSettableFields,
      });

      if (req.body.thermalVideoId)
        tagInstance.set('ThermalVideoRecordingId', req.body.thermalVideoId);
      if (req.body.irVideoId)
        tagInstance.set('IrVideoRecordingId', req.body.irVideoId);
      if (req.body.audioId)
        tagInstance.set('AudioRecordingId', req.body.audioId);

      tagInstance.set('taggerId', req.user.id);

      tagInstance
        .save()
        .then((saveRes) => {
          responseUtil.send(res, {
            statusCode: 200,
            success: true,
            messages: ['Added new Tag.'],
            tagId: tagInstance.id,
          })
        })
    });

  // Delete a tag
  app.delete(apiUrl, passport.authenticate(['jwt'], { session: false }),
    async function(req, res) {

      // Check that authentication was from a user not a device.
      if (req.user !== null && !requestUtil.isFromAUser(req))
        return responseUtil.notFromAUser(response);

      // Check that the required field is given.
      var id = parseInt(req.body.tagId);
      if (!id) {
        return responseUtil.send(res, {
          statusCode: 400,
          success: false,
          messages: ['Missing "tagId" field.'],
        });
      }

      // Check that user has permission to delete the tag.
      //TODO
      /*
      var userCanDeleteTag = await models.Tag.userCanDelete(req.body.tagId,
        req.user);
      if (!userCanDeleteTag)
        return responseUtil.send(res, {
          statusCode: 400,
          success: false,
          messages: [
            "Given user does not have permission to delete the tag."
          ]
        })
      */
      // Delete the tag
      var tagDeleteResult = await models.Tag.deleteFromId(req.body.tagId,
        req.user);
      if (tagDeleteResult)
        return responseUtil.send(res, {
          statusCode: 200,
          success: true,
          messages: ["Deleted tag."]
        });
      else
        return responseUtil.send(res, {
          statusCode: 400,
          success: false,
          messages: ["Failed to delete tag."]
        });
    });
}
