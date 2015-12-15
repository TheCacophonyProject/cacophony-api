var crypto = require('crypto');
var log = require('../logging');
var fs = require('fs');
var config = require('../config');
var knox = require('knox');
// parseModel: This function will parse a model resourse by using the data and the modelMap provided.
// model: This is the model where the parsed data is save to.
// data: A JSON of key value pairs representing the data. Each key value will either be some raw data, file, or aother model (childModel).
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
	  } else if (key == '__file') {
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

function parseFile(model, data) {
  log.verbose('Parsing file');
  return new Promise(function(resolve, reject) {
    try {
      var date;
      var file = data.__file;
      if (data.startTimestamp) {
        try {
          date = new Date(data.startTimestamp);
        } catch (err) {
          log.warn('Error from parding timestamp:', err);
          date = new Date();
        }
      } else {
        date = new Date();
      }
      var year = date.getFullYear();
      var month = date.getMonth();

      var md5sum = crypto.createHash('md5');

      var s = fs.ReadStream(file.path);
      s.on('data', function(d) {
        md5sum.update(d);
      });
      s.on('end', function() {
        var h = md5sum.digest('hex');
        var path = year+'/'+month+'/'+date.toISOString()+'_'+h;
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

// syncModel: This function will sync the model to the database.
// When syncing the mdodel first all the child models have to by synced to validate there IDs.
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
        console.log(model);
        reject(err);
      });
    })
    .catch(function(err) {
      log.error('Error with syncing child models for', model.name);
      reject(err);
    });
  });
}

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
      //reject('Bad response code from S3 server:', res.statusCode);
		} else {
      log.info('File uploaded to S3.');
    }
	});
}

// syncId: This function syncs the model to the database getting the ID of the model.
// This should only be called after all the child models within this model have been validated
// If the given model has an ID the ID is checked against the database to ensure they are equivalent.
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

// getModelId: This function will get a model ID.
// First by checking if there is an equivalent model in the database, if so it will use that ID.
// If not the model will be saved to the database and the returned ID saved to the model.
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


// findEquivalentModel: resolves a ID of an equivalent model, ignoring the id field. If no equivalent model is found 0 is resolved.
// Will log warning if more than one equivalent model is found.
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
    console.log(values);
    reject(err);
  });
});
};

// checkEquivalentModelById: Uses the ID from the model to do a query and check that the returned model is equivalent.
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

// equivalentModels: returns true or false depending on if the models are equivalent.
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


exports.parseModel = parseModel;
exports.syncModel = syncModel;
