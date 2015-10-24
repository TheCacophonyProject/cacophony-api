var orm = require('./orm'),
  log = require('./logging'),
  formidable = require('formidable'),
  DataPoint = require('./DataPoint'),
  assert = require('assert');
//Check Data IDs:
//Checks that the hardware, software and location IDs are valid.
//Returns a Promise that resolves when all IDs are checked.
//TODO the IDs are not properly checked at the moment, look into individual functions (checkHardwareId) for more detail.
function dataIDs(dataPoint){
return new Promise(function(resolve, reject) {
  var validateIdArray = [];
  for (var key in dataPoint.childModels) {
    validateIdArray.push(validateId(dataPoint.childModels[key]));
  }
	Promise.all(validateIdArray)
  .then(function() {
		log.debug("All data IDs are checked.");
		resolve(dataPoint);
	})
	.catch(function(err) {
		log.error("Error when checking data IDs.");
		reject(err);
	});
});
}

function validUploadRequest(request){
return new Promise(function(resolve, reject) {
  var form = new formidable.IncomingForm();
  form.parse(request, function(err, fields, files) {
		log.debug("Finsihed parsing form.");
		if (err) {
			log.error("Error when parsing form.");
			reject(err);
		} else {
      var json;
      var dataPoint;
      try {
        assert.notEqual(fields, null, 'Fields is null');
        assert.notEqual(files, null, 'Files is null');
        assert.notEqual(fields.json, null, 'Fields had no field named "json"');
        assert.notEqual(files.recording, null, 'Files had no field named "recording"');
        json = eval('('+fields.json+')');
        dataPoint = new DataPoint(json, files.recording);
      } catch (e) {
        log.error('Error: problem with processing request.');
        reject(e);
      }
      var models = [];
      models.push(dataPoint.parentModel.validate());
      for (var model in dataPoint.childModels) {
        models.push(dataPoint.childModels[model].validate());
      }
      Promise.all(models)
      .then(function(values) {
        var error = false;
        var errors = [];
        for (var i = 0; i < values.length; i++) {
          if (values[i] != undefined){
            error = true;
            errors.push(error);
          }
        }
        if (error) {
          log.debug('Error with validating data.');
          log.debug(errors);
          reject('Error with validating data');
        } else {
          resolve(dataPoint);
        }
      })
      .catch(function(err) {
        reject(err);
      });
    }
  });
});
}


//Check Location id:
//TODO function still in progress.
function validateId(model){
return new Promise(function(resolve, reject) {
  var modelName = model.__options.name.singular;
  //TODO add device registeration instead of giving it an id of 1
  //=============================
  if (modelName == 'device') {
    if (model.dataValues.id) {resolve()}
    else {
      model.setDataValue('id', 1);
      resolve();
    }
  }
  //========================
  if (model.dataValues.id){
    log.verbose('Checking valid equivalent locations.');
    checkEquivalentModelById(model)
    .then(function(equiv){
      if (equiv){
        log.verbose('Equivalent', modelName);
        resolve();
      } else {
        getModelId(model)
        .then(function(){
          log.debug('New '+modelName+' id.');
          resolve();
        })
        .catch(function(error){
          log.error('Error when getting new '+table.name+' id.');
          reject(error);
        });
      }
    });
	} else {
    getModelId(model)
    .then(function() {
      log.debug('New '+modelName+' id.');
      resolve();
    })
    .catch(function(err) {
      log.error('Error when getting '+modelName+'  id.');
      reject(err);
    });
	}
});
}

function getModelId(model){
return new Promise(function(resolve, reject) {
  findEquivalentModel(model)
  .then(function(result) {
    if (result == 0) {
      model.save()
      .then(function(result) {
        resolve();
      })
      .catch(function(err) {
        reject(err);
      });
    } else {
      model.setDataValue('id', result);
      resolve();
    }
  })
  .catch(function(err) {
    log.error('Error with getting model id');
    reject(err);
  })
});
};

function findEquivalentModel(model){
return new Promise(function(resolve, reject) {
  var values = model.dataValues;
  modelClass = orm.getClassFromModel(model);
  delete values.id;
  modelClass.findAll({ where: values })
  .then(function(result) {
    if (result.length == 0) {resolve(0);}
    else if (result.length == 1) {resolve(result[0].dataValues.id);}
    else if (result.length >= 2) {
      log.warn('Two or more rows were found to be equivalent');
      var id = result[0].dataValues.id;
      resolve(result[0].dataValues.id);
    } else {
      log.error('Invalid result length.');
      reject('Invalid result length, result:', result);
    }
  })
  .catch(function(err) {
    log.error('Error when getting new id.');
    log.error(err);
    reject(err);
  });
});
};

function checkEquivalentModelById(model){
return new Promise(function(resolve, reject){
  table.findAll({ where: { id: model.dataValues.id }})
  .then(function(result){
    var equiv = true;
    var result = result[0].dataValues;
    if (util.equivalentModels(reult[0]), model) {
      resolve(true);
    } else {
      log.error(model.__options.name.singular+' from the Database and DataPoint with the same id were not equivalent.');
      resolve(false);
    }
  })
  .catch(function(err) {
    reject(err);
  });
});
}

exports.dataIDs = dataIDs;
exports.validUploadRequest = validUploadRequest;
