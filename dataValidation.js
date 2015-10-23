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
	Promise.all([
		validateId(dataPoint, dataPoint.hardware, orm.Hardware),
		validateId(dataPoint, dataPoint.software, orm.Software),
		validateId(dataPoint, dataPoint.location, orm.Location)])
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
        reject(e.message);
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
function validateId(dataPoint, data, table){
return new Promise(function(resolve, reject) {
	if (data.id){
    log.verbose('Checking valid equivalent locations.');
    checkEquivalentRowsById(data, table)
    .then(function(equiv){
      if (equiv){
        dataPoint.checkedId[table.name] = true;
        log.verbose('Equivalent', table.name);
        resolve();
      } else {

        getRowId(data, table)
        .then(function(){
          log.debug('New '+table.name+' id.');
          dataPoint.newId[table.name] = true;
          dataPoint.checkedId[table.name] = true;
          resolve();
        })
        .catch(function(error){
          log.error('Error when getting new '+table.name+' id.');
          reject(error);
        });
      }
    });
	} else {
    getRowId(data, table)
    .then(function() {
      log.debug('New location id.');
      dataPoint.newId[table.name] = true;
      dataPoint.checkedId[table.name] = true;
      resolve();
    })
    .catch(function(err) {
      log.error('Error when getting '+table.name+'  id.');
      reject(err);
    });
	}
});
}

function getRowId(data, table){
return new Promise(function(resolve, reject) {
  findEquivalentRow(data, table)
  .then(function(result) {
    if (result == 0) {
      orm.uploadNewRow(data, table)
      .then(function(result) {
        data.id = result.dataValues.id;
        resolve();
      })
    } else {
      data.id = result;
      log.verbose('Equivalent row in '+table.name+' found. Using same id of', result);
      resolve();
    }
  })
});
};

function findEquivalentRow(data, table){
return new Promise(function(resolve, reject) {
  var values = data;
  if (values.id) { delete values.id; }

  table.findAll({ where: values })
  .then(function(result) {
    if (result.length == 0) resolve(0);
    else if (result.length == 1) resolve(result[0].dataValues.id);
    else if (result.length >= 2) {
      log.warn('Two or more rows were found to be equivalent in the table:', table.name);
      resolve(result[0].dataValues.id);
    } else {
      log.error('Invalid reult length.');
      reject('Invalid result length, result:', result);
    }
  })
  .catch(function(err) {
    log.error('Error when getting new '+table.name+' id.');
    log.error(err);
    reject(err);
  });
});
};

function checkEquivalentRowsById(value, table){
return new Promise(function(resolve, reject){
  table.findAll({ where: { id: value.id }})
  .then(function(result){
    var equiv = true;
    var result = result[0].dataValues;
    for (var key in result) {
      if (key == 'microphoneId') {     //Enter in keys that have default values here to deal with them.  //TODO find a cleaner way t deal with this
        if (!(result['microphoneId'] == 0 && !value['microphoneId'] || result['microphoneId'] && value['microphoneId'])) {
          equiv = false;
        }
      } else if (key != 'createdAt' && key != 'updatedAt'){
        if (value[key] && result[key] == value[key]){

        } else if (!value[key] && result[key] == null){

        } else {
          log.error(key + ' in table '+table.name+' is not equivalent. Database: ' + result[key] +', DataPoint: ' + value[key]);
          equiv = false;
        }
      }
    }
    if (!equiv){ log.error(table.name+' from the Database and DataPoint with the same id were not equivalent.'); }
    resolve(equiv);
  });
});
}

exports.dataIDs = dataIDs;
exports.validUploadRequest = validUploadRequest;
