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
		//console.log("All data IDs are checked.");		//TODO check the current IDs
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
		dataPoint.checkedHardwareId = true;
		resolve(dataPoint);
		//DataPoint has an ID, check that it is valid
		//TODO check if the data is the same, if it is then carry on, if not do a new post and get new hardware ID;
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
//TODO function still in progress.
function validateSoftwareId(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.software.id){
		//TODO as with hardware check.
		dataPoint.checkedSoftwareId = true;
		resolve(dataPoint);
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
		dataPoint.checkedLocationId = true;
		//TODO as with hardware check.
		resolve();
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

exports.dataIDs = dataIDs;
