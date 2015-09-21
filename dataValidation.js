var orm = require('./orm');
//Check Data IDs:
//Checks that the hardware, software and location IDs are valid.
//Returns a Promise that resolves when all IDs are checked.
//TODO the IDs are not properly checked at the moment, look into individual functions (checkHardwareId) for more detail.
function dataIDs(dataPoint){
return new Promise(function(resolve, reject) {
	Promise.all([
		validateHardwareId(dataPoint),
		validateSoftwareId(dataPoint),
		validateLocationId(dataPoint)])
	.then(function() {
		console.log("All data IDs are checked.");
		resolve(dataPoint);
	})
	.catch(function(err) {
		console.log("Error when checking data IDs.");
		reject(err);
	});
});
}

//Check Hardware id:
//TODO function still in progress.
function validateHardwareId(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.hardware.id){
		console.log('Checking equialent hardwares.');
    checkEquivalentRowsById(dataPoint.hardware, orm.Hardware)
    .then(function(equiv) {
      if (equiv){
        checkedHardwareId = true;
        console.log('Equivalent hardwares.');
        resolve();
      } else {
        console.log('Error: hardwares are not Equivalent.');
        reject('Error with equivalent hardwares.');
      }
    });
	} else {
		//No hardware id, get new one
    orm.uploadHardware(dataPoint.hardware)
    .then(function(result) {
      dataPoint.hardware.id = result.dataValues.id;
      dataPoint.newHardwareId = true;
      dataPoint.checkedHardwareId = true;
      resolve();
      console.log('Successfully got new hardware id.');
    })
    .catch(function(err){
      console.log("Error when getting new hardware id.");
      reject(err);
    });
	}
});
}

//Check Software id:
function validateSoftwareId(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.software.id){
    console.log('Checking valid equivalent software');
    checkEquivalentRowsById(dataPoint.software, orm.Software)
    .then(function(equiv){
      if (equiv){
        dataPoint.checkedSoftwareId = true;
        console.log('Equivalent Softwares');
        resolve();
      } else {
        consoel.log('Error: Softwares were not equialent.');
        reject('Error with software id.');
      }
    });
	} else {
		//No software id, get new one
    orm.uploadSoftware(dataPoint.software)
    .then(function(result) {
      dataPoint.software.id = result.dataValues.id;
      dataPoint.newSoftwareId = true;
      dataPoint.checkedSoftwareId = true;
      resolve();
      console.log('Successfully got new software id.');
    })
    .catch(function(err){
      console.log("Error when getting new software id.");
      reject(err);
    });
	}
});
}

//Check Location id:
//TODO function still in progress.
function validateLocationId(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.location.id){
    console.log('Checking valid equivalent locations.');
    checkEquivalentRowsById(dataPoint.location, orm.Location)
    .then(function(equiv){
      if (equiv){
        dataPoint.checkedLocationId = true;
        console.log('Equivalent locations.');
        resolve();
      } else {
        console.log('Error: Locations were not equivalent.');
        reject('Error with location id.');
      }
    });
	} else {
		//No location id, get new one
    orm.uploadLocation(dataPoint.location)
    .then(function(result) {
      dataPoint.location.id = result.dataValues.id;
      dataPoint.newLocationId = true;
      dataPoint.checkedLocationId = true;
      resolve();
      console.log('Successfully got new location id.');
    })
    .catch(function(err){
      console.log("Error when getting new location id.");
      reject(err);
    });
	}
});
}

function checkEquivalentRowsById(value, table){
return new Promise(function(resolve, reject){
  table.findAll({ where: { id: value.id }})
  .then(function(result){
    var equiv = true;
    var result = result[0].dataValues;
    for (var key in result) {
      if (key == 'microphoneId') {     //Enter in keys that have default values here to deal with them.  //TODO find a cleaner way t deal with this
        console.log('Checking default values');
        if (!(result['microphoneId'] == 0 && !value['microphoneId'] || result['microphoneId'] && value['microphoneId'])) {
          equiv = false;
        }
      } else if (key != 'createdAt' && key != 'updatedAt'){
        if (value[key] && result[key] == value[key]){

        } else if (!value[key] && result[key] == null){

        } else {
          console.log(key + 'is not equivalent. Database: ' + result[key] +', DataPoint: ' + value[key]);
          equiv = false;
        }
      }
    }
    resolve(equiv);
  });
});
}

exports.dataIDs = dataIDs;
