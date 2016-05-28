var util = require('./util');
var orm = require('./orm');
var log = require('../logging');

/**
 * Location represents a model showing the different fields and if they are a special case (file or child model).
 * This model will be saved in the "locations" table in the database.
 *
 * @module location
 *
 * @param {Object}  data  This is the metadata of the location.
 */

module.exports = function(data) {
  log.verbose('New Location Object');

  this.name = 'location';
  this.ormClass = orm.location;

  this.modelMap = {
    id: {},                 // The ID of the location in the database.
    timestamp: {},          // Timestamp of when the location was updated. Using ISO 8601 format.
    latitude: {},           // Latitude of locatoin.
    longitude: {},          // Longitude of location.
    altitude: {},           // Altitude of locatio  in meters.
    accuracy: {},           // Accuracy of location in meters. Accuracy as the radius of 68% confidence.
    userLocationInput: {},  // A user input about the location.
    tags: {},
    extra: {}
  }

  this.ormBuild = null;   // The ORM build of the model.
  this.modelData = {};    // JSON of the metadata excluding the child models.
  this.childModels = [];  // List of the child models.

  if (data) util.parseModel(this, data);

  var model = this;
  this.query = function(q, apiVersion) {
    log.debug("Quering some "+model.name+": "+JSON.stringify(q));
    switch(apiVersion) {
      case 1:
        return apiV1Query(q);
        break;
      default:
        log.warn("No api version given.");
        return;
        break;
    }
  }

  function apiV1Query(q) {
    return util.getModelsJsonFromQuery(q, model, 1);
  }
}
