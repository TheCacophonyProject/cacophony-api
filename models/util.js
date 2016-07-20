var crypto = require('crypto');
var log = require('../logging');
var fs = require('fs');
var config = require('../config');
var knox = require('knox');
var pointer = require('json-pointer');
var orm = require('./orm');
var AudioFile = require('./audioFile');
var Location = require('./location');
var AWS  = require('aws-sdk');
var path = require('path');

// Models util
// ===========

/**
 * Parses data into a model by saving the directly related metadata to model.modelData (everything apart from child models and files).
 * If the model has child models or a file they are saved into model.childModels and model.file.
 * @method parseModel
 * @public
 *
 * @param {Object} model    The type of model to be parsed.
 * @param {Object} data     Object containing the data to be parsed into the model.
 */

function parseModel(model, data) {
  log.debug('Parsing model', model.name);
  var childModels = [];
  var modelData = {};
  for (var key in data) {
	  if (model.modelMap.hasOwnProperty(key)) {
      if (model.modelMap[key].model) { //This indicates that it is a child model.
        childModels.push(new model.modelMap[key].model(data[key]));
			} else {
        modelData[key] = data[key];
			}
	  } else if (key == '__file') {  //This indicates that it is a file.
      model.file = data[key];
      model.fileParser = parseFile(model, data);
    }
    else {
	    log.error('Unrecognised key "' + key + '" in ' + model.name);
      log.error('Data:', data);
		}
	}
  model.modelData = modelData;
  model.childModels = childModels;
}

/**
 * Will sync a model to the database. The model should have been generated using modelParses for the sync to properly work.
 * All child models of the model that is being synced have to be synced before as the parent model needs the ID of the child models.
 * After all child models are synced, if any, the ID of the child models are saved into the metadata of the model
 * then the model it self is synced to the database.
 *
 * @method syncModel
 * @public
 *
 * @param {Object} model  The model to be synced to the database.
 *
 * @return {Promise} A promise that resolves, whit the model that was synced, when the model has been saved to the database.
 */

function syncModel(model){
  log.debug('Syncing model:', model.name);
  return new Promise(function(resolve, reject) {
    var childModelsPromise = [];
    for (var childModel of model.childModels) {
      childModelsPromise.push(syncModel(childModel));
    }
    if (model.fileParser) {
      childModelsPromise.push(model.fileParser);
    }
    Promise.all(childModelsPromise)
    .then(function(childModelResults) {
      for (var modelResult of childModelResults) {
        if (modelResult === 'file') {
          model.modelData.fileLocation = model.file.uploadPath;
        }
        else {
          model.modelData[modelResult.name+'Id'] = modelResult.modelData.id;
        }
      }
      model.ormBuild = model.ormClass.build();
      var vals = model.modelData;
      delete vals.__file;
      model.ormBuild.setFromJson(vals);

      syncId(model)
      .then(function() {
        log.info('Sync finished of', model.name);
        resolve(model);
      })
      .catch(function(err) {
        log.error('Error with syncing model ID');
        reject(err);
      });
    })
    .catch(function(err) {
      log.error('Error with syncing child models for', model.name);
      reject(err);
    });
  });
}


/**
 * Parses a file from a model. A timestamp is generated for the file if not found.
 * A file path is generated determined by the hash of the file and timestamp
 * [year]/[month]/[ISO 8601 timestamp + hash fo file]
 *
 * @method parseFile
 *
 * @param {Object} model    The model that is related to the file.
 * @param {Object} data     The data of the file. The important fields are data.__file (the file) and data.startTimestamp.
 *
 * @return {Promise} A promise that after hashing the file is resolved with 'file'.
 */

function parseFile(model, data) {
  log.verbose('Parsing file');
  return new Promise(function(resolve, reject) {
    try {
      var date;
      var dateISOString;
      var file = data.__file;
      if (data.startTimestamp) {
        try {
          date = new Date(data.recordingDateTime);
          dateISOString = date.toISOString();
        } catch (err) {
          log.warn('Error from parsing recordingDateTime:', err);
          log.warn('recordingDateTime', data.recordingDateTime);
          date = new Date();
          dateISOString = date.toISOString();
        }
      } else {
        date = new Date();
        dateISOString = date.toISOString();
      }
      var year = date.getFullYear();
      var month = date.getMonth();

      var md5sum = crypto.createHash('md5');
      var extension = path.extname(file.name);
      var s = fs.ReadStream(file.path);
      s.on('data', function(d) {
        md5sum.update(d);
      });
      s.on('end', function() {
        var h = md5sum.digest('hex');
        var path = year+'/'+month+'/'+dateISOString+'_'+h+extension;
        file.hash = h;
        file.uploadPath = path;
        model.fileLocationField = path;
        resolve('file');
      });

    } catch (err) {
      log.error('Error when parsing file.');
      reject(err);
    }
  });
}


/**
 * Uploads a file to the S3 service.
 * Path used on S3 server is file.uploadPath
 * @method uploadFile
 *
 * @param {Object} file   The file should have file.uploadPath and file.path (local path) set.
 */

function uploadFile(file){
  log.debug('Uploading file.');
	var client = knox.createClient({
		key: config.s3.publicKey
	  , secret: config.s3.privateKey
	  , bucket: config.s3.bucket
	  , region: config.s3.region
	});

	var tempFilePath = file.path;
	var filePath = file.uploadPath;
	log.debug("Uploading file as:", filePath);
	client.putFile(tempFilePath, filePath, function(err, res){
		if (err) {
			log.error("Error with uploading file.");
		} else if (res.statusCode != 200) {
			log.error("Error with uploading file. Response code of:", res.statusCode);
      log.error(res);
		} else {
      log.info('File uploaded to S3.');
    }
	});
}

/**
 * SyncId will take a model and 'sync the ID'.
 * What this means is if the model has an ID the id will be checked against the database to check that the data is consistant.
 * If the data is consistant the promise is resolved.
 * If the data is found not to be consistant a wanring is logged and then the model is given a new ID.
 * If the model didn't have a ID to start with it is geven an ID.
 *
 * @method syncId
 *
 * @param {Object}  model
 *
 * @return {Promise} A promise that resolves after the model ID is synced with the database.
 */
function syncId(model){
return new Promise(function(resolve, reject) {
  //TODO add device registeration instead of giving it an id of 1
  //=============================
  if (model.name == 'device') {
    log.warn('Devices are not being registered yet, if device has no ID an ID of "a" is given to it.');
    if (model.ormBuild.dataValues.id) {
      resolve();
    }
    else {
      model.ormBuild.setDataValue('id', 'a');
      resolve();
    }
  }

  //Model has an ID
  else if (model.ormBuild.dataValues.id) {
    log.verbose('Checking that the ID is valid for ', model.name);
    checkEquivalentModelById(model)
    .then(function(equiv){
      if (equiv){ //Model had correct ID
        log.verbose('Equivalent ID for ', model.name);
        resolve();
      } else { //Model had incorrect ID.
        getModelId(model)
        .then(function(){
          resolve();
        })
        .catch(function(error){
          log.error('Error with replacing model ID for', model.name);
          reject(error);
        });
      }
    })
    .catch(function(err) {
      log.error('Error when finding equivalent model by ID for', model.name);
      reject(err);
    });

  //Model does not have an ID
	} else {
    getModelId(model)
    .then(function() {
      log.debug('Got '+model.name+' id.');
      resolve();
    })
    .catch(function(err) {
      log.error('Error with getting new  model ID for', model.name);
      log.error(err);
      reject(err);
    });
	}
});
}

/**
 * getModelId will check id the database has an equivalent model. If so the model is given this ID.
 * If not the model data is saved to the database and the ID returned from the database is save onto the model.
 *
 * @method getModelId
 *
 * @param {Object}  model
 *
 * @return {Promise} A promise that resolves when the model has an ID.
 */
function getModelId(model){
return new Promise(function(resolve, reject) {
  log.verbose('Get model ID for', model.name);
  findEquivalentModel(model)
  .then(function(result) {
    if (result == 0) {
      var hash = crypto.createHash('md5').update(JSON.stringify(model.ormBuild.dataValues)).digest('hex');
      model.ormBuild.setDataValue('id', hash);
      model.modelData.id = hash;
      model.ormBuild.save()
      .then(function(result) {
        if (model.file) {
          uploadFile(model.file);
        }
        resolve();
      })
      .catch(function(err) {
        log.error('Error with saving model', model.name);
        reject(err);
      });
    } else {
      model.ormBuild.setDataValue('id', result);
      model.modelData.id = result;
      resolve();
    }
  })
  .catch(function(err) {
    log.error('Error with getting model ID for', model.name);
    reject(err);
  })
});
};

/**
 * findEquivalentModel will search the database for an equivalent model and resolves with that model if any are found.
 * If no equivanent models are found the promise resolves with 0.
 * If more than one model is found to be equivalent a warning is logged as this should not happen in the database.
 *
 * @method findEquivalentModel
 *
 * @param {Object}  model
 *
 * @return {Promise} A promise that resolves after checking the database for an equivalent model.
 */
function findEquivalentModel(model){
return new Promise(function(resolve, reject) {
  log.verbose('Find equivalent model for', model.name);
  var values = model.ormBuild.dataValues;
  delete values.id;
  model.ormClass.findAll({ where: values })
  .then(function(result) {
    if (result.length == 0) {
      log.verbose('No equivalent model found for', model.name);
      resolve(0);
    }
    else if (result.length == 1) {
      log.verbose('One equivalent model found for', model.name)
      resolve(result[0].dataValues.id);
    }
    else if (result.length >= 2) {
      log.warn('Two or more rows were found to be equivalent for', model.name);
      var id = result[0].dataValues.id;
      resolve(result[0].dataValues.id);
    } else {
      log.error('Invalid result length.');
      reject('Invalid result length, result:', result);
    }
  })
  .catch(function(err) {
    log.error('Error with orm findAll request for model', model.name);
    reject(err);
  });
});
};

/**
 * checkEquivalentModelById will check if a model that has an ID is consistant with the database.
 *
 * @method checkEquivalentModelById
 *
 * @param {Object}  model
 *
 * @return {Promise} A promise that resolves with true or false depending if the model is consistant.
 */
function checkEquivalentModelById(model){
return new Promise(function(resolve, reject){
  log.verbose('Equivalent model by ID for', model.name);
  model.ormClass.findAll({ where: { id: model.ormBuild.dataValues.id }})
  .then(function(result){
    if (result.length == 0) {
      log.warn('Model "'+model.name+'" had a  ID that was not in the database.');
      resolve(false);
    } else {
      var resultModel = result[0].dataValues;
      if (equivalentModels(resultModel, model.ormBuild.dataValues)) {
        resolve(true);
      } else {
        log.warn('The ID given matches to a model that is not equivalent for', model.name);
        resolve(false);
      }
    }
  })
  .catch(function(err) {
    log.error('Error with checking equivalent modeles by ID for', model.name);
    reject(err);
  });
});
}

/**
 * equivalentModels takes two models and compares them to see if they are equivalent.
 *
 * @method equivalentModels
 *
 * @param {Object}  model1
 * @param {Object}  model2
 *
 * @return {Boolean} true if models are equivalent.
 */
function equivalentModels(model1, model2){
  var values1 = model1;
	var values2 = model2;
	delete values1.createdAt;
	delete values1.updatedAt;
	delete values2.createdAt;
	delete values2.updatedAt;
	for (var key in values1) {
		if (typeof values1[key] == 'object' && values1[key] != null) {
			if (!equivalentJson(values1[key], values2[key])){
				return false;
			}
		}
		else if (values1[key] != values2[key]) {
			return false;
		}
	}
	for (var key in values2) {
		if (typeof values2[key] == 'object' && values2[key] != null) {
			if (!equivalentJson(values1[key], values2[key])){
				return false;
			}
		}
		else if (values1[key] != values2[key]) {
			return false;
		}
	}
	return true;
}

/**
 * equivalentJson checkes to see if the models are equivalent.
 *
 * @method equivalentJson
 *
 * @param {JSON}  json1
 * @param {JSON}  json2
 *
 * @return {Boolean} true if the JSONs are equivalent.
 */
function equivalentJson(json1, json2){
	if (typeof json1 != 'object') return false;
	if (typeof json2 != 'object') return false;
	for (var key in json1) {
		if (typeof json1[key] == 'object' && !equivalentJSON(json1[key], json2[key])) {
			return false;
		}
		if (json1[key] != json2[key]) {
			return false;
		}
	}
	for (var key in json2) {
		if (typeof json1[key] == 'object' && !equivalentJSON(json1[key], json2[key])) {
			return false;
		}
		if (json1[key] != json2[key]) {
			return false;
		}
	}
	return true;
}

/**
 * Gets a model from the database using the id.
 *
 * @method getModelFromId
 *
 * @param {object} model
 * @param {object} id
 */
function getModelFromId(model, id){
return new Promise(function(resolve, reject) {
  var ormClass = model.ormClass;
  //Checking valid data.
  if (!model) {
    log.error('Invalid model');
    reject('Invalid model');
    return;
  }
  if (!id) {
    log.error('Invalid id.');
    reject('Invalid id');
    return;
  }
  if (!ormClass) {
    log.error('No ORM class found in model.');
    reject('No ORM class found in model.');
    return;
  }
  //Finding model.
  var childModels = {};
  for (field in model.modelMap) {
    if (model.modelMap[field].model) {
      childModels[field] = model.modelMap[field];
    }
  }
  ormClass.findAll({ where: { id: id }})
  .then(function(result) {
    if (result.length == 0) {
      resolve({"Message": "No model with that id."});
      return;
    }
    var modelDataValues = result[0].dataValues;
    for (cm in childModels) {
      var cmId = modelDataValues[cm+"Id"];
      if (cmId) {
        childModels[cm].id = cmId;
        delete modelDataValues[cm+"Id"];
      } else {
        delete childModels[cm];
      }
    }
    var childModelsGets = [];
    for (cm in childModels) {
      childModelsGets.push(getModelFromId(new childModels[cm].model, childModels[cm].id));
    }
    Promise.all(childModelsGets)
    .then(function(cmResults) {

      for (var i = 0; i < cmResults.length; i++) {
        var r = cmResults[i];
        for (key in r) {
          modelDataValues[key] = r[key];
        }
      }
      var finalResult = {};
      finalResult[model.name] = modelDataValues;
      resolve(finalResult);
    })
    .catch(function(cmErrors) {
      log.error("Error when getting child models: "+cmErrors);
      reject(cmErrors);
    });

    //resolve(result);
  })
  .catch(function(err) {
    log.error("Error with finding model with id of: " + id);
    reject(err);
  });
});
}

var logicOperations = ['$or', '$and'];

function getChildModelPromises(query, model, apiVersion) {
  var pointers = {};
  for (var condition in query) {
    if (logicOperations.indexOf(condition) >= 0) {
      var recursiveResults = getChildModelPromises(query, model, apiVersion);
      for (var rr in recursiveResults) {
        pointers['/'+condition+rr] = recursiveResults[rr];
      }
    } else if(!model.modelMap[condition]) {
      log.warn("No key in " + model.name + "called '"+condition+"'");
    } else if(model.modelMap[condition].model) {
      var childModel = new model.modelMap[condition].model;
      pointers['/'+condition] = childModel.query(query[condition], apiVersion);

    }
  }
  return pointers;
}


function getModelsFromQuery(query, model, apiVersion) {
  return new Promise(function(resolve, reject) {
    var childPromises = getChildModelPromises(query, model, apiVersion);
    jsonPromises(childPromises)
    .then(function(childPromisesResults) {
      var childIds = {};
      for (var cpr in childPromisesResults) {
        var idList = [];
        for (var cp in childPromisesResults[cpr]) {
          idList.push(childPromisesResults[cpr][cp].id);
        }
        childIds[cpr] = {$in: idList}
      }
      var cat = jsonPointerJoiner(query, childIds);
      return {ormClass: model.ormClass,
        query: {where: cat}
      }
    })
    .then(findAll)
    .then(function(res) {
      log.debug("Number of query results for "+model.name+":", res.length);
      resolve(res);
    })
    .catch(function(err) {
      log.error("Error in getModelsFromQuery");
      reject(err);
    });
  });
}

function findAll(data) {
  return new Promise(function(resolve, reject) {
    data.ormClass.findAll(data.query)
    .then(function(res) {
      resolve(res);
    })
    .catch(function(err) {
      log.error("Error with query.");
      reject(err);
    })
  });
}

function itterateThroughQuery(query, model, apiVersion) {
  log.debug('Itterate Through this:', query);
  return new Promise(function(resolve, reject) {

    var pointers = {};
    for (var key in query) {
      if (logicOperations.indexOf(key) >= 0) {
        var recursiveResult = itterateThroughQuery(query[key])
        for (var k in recursiveResult) {
          pointers['/'+key+k] = rec[k];
        }
      } else if (!model.modelMap[key]) {
        log.warn("No key in " + model.name + " called '" + key+"'");
        reject("No key in " + model.name + " called '" + key+"'");
        return;
      } else if (model.modelMap[key].model){
        pointers['/'+key] = model.modelMap[key].model(query[key], apiVersion);
      }
    }
    jsonPromises(pointers)
    .then(function(result) {
      resolve(jsonPointerJoiner(query, pointers));
    })
    .catch(function(err) {
      log.error("Error:", err);
    })
  });
}

function jsonPointerJoiner(json, pointers) {
  for (key in pointers) {
    pointer.remove(json, key);
    pointer.set(json, key+"Id", pointers[key]);
  }
  return json;
}

function jsonPromises(promiseJson){
  return new Promise(function(resolve, reject) {
    var jsonKeys = [];
    var promises = [];
    var res = {};
    for (var key in promiseJson) {
      jsonKeys.push(key);
      promises.push(promiseJson[key]);
    }
    Promise.all(promises)
    .then(function(values) {
      for (var i = 0; i<values.length; i++) {
        res[jsonKeys[i]] = values[i]
      }
      resolve(res);
    }, function(error) {
      reject(error);
    });
  });
}

function getModelsJsonFromQuery(q, model, apiVersion) {
  return new Promise(function(resolve, reject) {
    getModelsFromQuery(q, model, apiVersion)  //Get list of models
    .then(function(res) {

      //Get list of dataValues
      var models = [];
      for (var modelResult in res) {
        models.push(res[modelResult].dataValues);
      }
      //Get list of childModels to query
      var childModels = {};
      var childModelPromises = {};
      for (var i in models) {
        data = models[i];
        //Going thrugh child models in data.

        for (var key in data) {
          var len = key.length;
          var idStr = key.substr(len-2, 2);
          var modelName = key.substr(0, len-2);
          var isModel = (idStr == "Id" && model.modelMap[modelName]);

          if (isModel) {
            var childModel = new model.modelMap[modelName].model();

            //Exit if not audioFile, used for testing.
            //if (model.modelMap[modelName].model == AudioFile || model.modelMap[modelName].model == Location) {
            if ( data[key] ) {
              var queryJson = {"id":data[key]};
              childModelPromises[data[key]] = childModel.query(queryJson, apiVersion);
            }

          }
        }
      }


      //Getting child model data
      jsonPromises(childModelPromises)
      .then(function(childModelResults) {
        for (var i in models) {
          var dataValues = models[i];
          for (var d in dataValues) {
            if(childModelResults[dataValues[d]]) {
              models[i][d] = childModelResults[dataValues[d]][0];

            }
          }
        }
        resolve(models);
      })
      .catch(function(err) {
        log.error("Error with child promises.");
        reject(err);
      })
    })
    .catch(function(err) {
      log.error("Error with model query.");
      reject(err);
    })
  });
}

function getFileSignedUrl(fileDir) {

  return new Promise(function(resolve, reject) {
    AWS.config.update({
      accessKeyId: config.s3.publicKey,
      secretAccessKey: config.s3.privateKey,
      region: config.s3.region}
    );
    var s3 = new AWS.S3();

    var params = {
      Bucket: config.s3.bucket,
      Key: fileDir
    };

    s3.getSignedUrl('getObject', params, function(err, url) {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
};

function updateTags(model, id, tags, type){
  switch (type) {
    case 'replace':
      return replaceTags(model, id, tags);
      break;
    default:
      log.warn('No tags type opperation:', type);
  }
};

function replaceTags(model, id, tags) {
  log.verbose("Replacing tags on "+model.name+": "+id+" to "+JSON.stringify(tags));
  return new Promise(function(resolve, reject) {
    model.ormClass.update({tags:tags}, {where:{id:id}})
    .then(function(result) {
      if (result[0] < 1)
        reject("No models changed.");
      else
        resolve("Finished tag replacing.");
    })
    .catch(function(err) {
      log.warn("Error with replacing tags.");
      reject(err);
    });
  });
};

exports.parseModel = parseModel;
exports.syncModel = syncModel;
exports.getModelFromId = getModelFromId;
exports.itterateThroughQuery = itterateThroughQuery;
exports.getModelsFromQuery = getModelsFromQuery;
exports.getModelsJsonFromQuery = getModelsJsonFromQuery;
exports.getFileSignedUrl = getFileSignedUrl;
exports.updateTags = updateTags;
