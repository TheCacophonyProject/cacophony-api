var BUCKET_NAME = 'testBucket';

var DataPoint = require('./DataPoint'),
	s3 = require('./S3'),
	database = require('./PostgreSQL'),
	Promise = require('bluebird'),
	pg = require('pg'),
	formidable = require('formidable'),
	knox = require('knox');

//Parse Form: Takes a request and parses it into a DataPoint 
function parseRequest(request){
return new Promise(function(resolve, reject) {
	var form = new formidable.IncomingForm();
	console.log("About to parse incoming form.");
	
	form.parse(request, function(err, fields, files) {
		console.log("Parsing form done. ");
		if (err) {
			console.log("Error when parsing form.");
			reject(err);
		} else {
			var dataPoint = new DataPoint(eval('('+fields.DATA_POINT+')'), files.RECORDING);
			resolve(dataPoint);
		}
	});
});
}

//Register device if not already:
//TODO function still in progress.
function registerDeviceIfNotAlready(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.deviceId){
		resolve(dataPoint);		
	} else {
		//TODO register device
		console.log("Device is not registered, for now a device id of 1 will be given to it.");
		dataPoint.deviceId = 1;
		resolve(dataPoint);
	}
});
}

//Connect to database:
//Connects to the PostgreSQL database using the settings in the local file "PostgreSQL.json".
//Returns a Promise that resolves after the connection is established. The connection is saved in the DataPoint that is resolved.
//TODO look into to see if there is a safer way to load the PostgreSQL private settings.
//TODO see if it is better to have a new connection for each dataPoint or just have one for the server. 
function connectToDB(dataPoint){
return new Promise(function(resolve, reject) {
	var host = database.host;
	var port = database.port;
	var password = database.password;
	var db = database.name;
	var userName = database.username;

	var conString = "postgres://"+userName+":"+password+"@"+host+":"+port+"/"+db;
	var client = new pg.Client(conString);
	console.log("Connecting to DB.");
	client.connect(function(err) {
		if (err) {
			console.log("Error with connecting to DB.");
			reject(err); 
		}
		else {
			console.log("Connected to DB.");
			dataPoint.client = client;
			resolve(dataPoint);
		}
	});
});
}

//Upload data point:
//Takes a data point and uploads it to the PostgreSQL data base.
//Returns a Promise that resolves when finished uploading the DataPoints main data.
function uploadDataPoint(dataPoint){
return new Promise(function(resolve, reject) {
	if (!dataPoint.readyForUpload()) { reject(); }
	
	dataPoint.client.query(dataPoint.getDataPointInsert(), function(err, result) {
		if (err) { 
			console.log("Error with uploading DataPoint.");
			reject(err); 
		}
		else {
			console.log("Added DataPoint to database.");
			dataPoint.uploaded = true;
			resolve(dataPoint);
		}
	});
});
}

//Upload File:
//Uploads the file (recording) to the Amazon S3 service.
//Returns a Promise that resolves when the file (recording) finishes uploading.
//NOTE: Amazon S3 service is used at the moment but alternatives to Amazon should be looked into. 
function uploadFile(dataPoint){
return new Promise(function(resolve, reject) {
	var client = knox.createClient({
		key: s3.publicKey
	  , secret: s3.privateKey
	  , bucket: s3.bucket
	  , region: 'us-west-2'
	});

	var tempFilePath = dataPoint.tempFilePath;
	var fileName = dataPoint.getFileName();
	console.log("Uploading file as:", fileName);
	client.putFile(tempFilePath, fileName, function(err, res){
		if (err) {
			console.log("Error with uploading file.");
			reject(err); 
		} else {
			console.log("Uploaded file.");
			resolve(dataPoint);
		}
	});
});
}

//Check Data IDs:
//Checks that the hardware, software and location IDs are valid.
//Returns a Promise that resolves when all IDs are checked.
//TODO the IDs are not properly checked at the moment, look into individual functions (checkHardwareId) for more detail.
function checkDataIDs(dataPoint){
return new Promise(function(resolve, reject) {
	Promise.all([
		checkHardwareId(dataPoint),
		checkSoftwareId(dataPoint),
		checkLocationId(dataPoint)])
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
function checkHardwareId(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.hardware.id){
		dataPoint.checkedHardwareId = true;
		resolve(dataPoint);
		//DataPoint has an ID, check that it is valid
		//TODO check if the data is the same, if it is then carry on, if not do a new post and get new hardware ID;
	} else {
		//No hardware id, get new one
		var insertQuery = dataPoint.getHardwareInsert() + " RETURNING id";
		dataPoint.client.query(insertQuery, function(err, result) {
			if (err) { 
				console.log("Error with getting new hardware id.");
				reject(err); 
			} else {
				dataPoint.newHardwareId = true;
				dataPoint.hardware.id = result.rows[0].id;
				dataPoint.checkedHardwareId = true;
				console.log("Successfully got new hardware id.");
				resolve(dataPoint);
			}
		});
	}
});
}

//Check Software id:
//TODO function still in progress.
function checkSoftwareId(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.software.id){
		//TODO as with hardware check.
		dataPoint.checkedSoftwareId = true;			
		resolve(dataPoint);
	} else {
		//No software id, get new one
		var insertQuery = dataPoint.getSoftwareInsert() + " RETURNING id";
		dataPoint.client.query(insertQuery, function(err, result) {
			if (err) {
				console.log("Error with getting new software id."); 
				reject(err); 
			} else {
				dataPoint.newSoftwareId = true;
				dataPoint.software.id = result.rows[0].id;
				dataPoint.checkedSoftwareId = true;
				console.log("Successfully got new software id.");
				resolve(dataPoint);
			}
		});
	}
});
}

//Check Location id:
//TODO function still in progress.
function checkLocationId(dataPoint){
return new Promise(function(resolve, reject) {
	if (dataPoint.location.id){
		dataPoint.checkedLocationId = true;
		//TODO as with hardware check.			
		resolve(dataPoint);
	} else {
		//No location id, get new one
		var insertQuery = dataPoint.getLocationInsert() + " RETURNING id";
		dataPoint.client.query(insertQuery, function(err, result) {
			if (err) {
				console.log("Error with getting new location id."); 
				reject(err); 
			} else {
				dataPoint.newLocationId = true;
				dataPoint.location.id = result.rows[0].id;
				dataPoint.checkedLocationId = true;
				console.log("Successfully got new location id.");
				resolve(dataPoint);
			}
		});
	}
});
}


//Generate success response:
//Returns a JSON as a String that is to be sent back to the device (Cacophonometer) when the upload was a success.
//JSON includes new hardware, software and location IDs if there were new ones made.
//TODO there is probably a better way to send a JSON back to the device. 
function generateSuccessResponse(dataPoint) {
	var jsonResponse = {response: 'success'};
	if(dataPoint.newHardwareId){
		jsonResponse.newHardwareId = dataPoint.hardware.id;
	}
	if(dataPoint.newSoftwareId){
		jsonResponse.newSoftwareId = dataPoint.software.id;
	}
	if(dataPoint.newLocationId){
		jsonResponse.newLocationId = dataPoint.location.id;
	}
	return JSON.stringify(jsonResponse);
}

exports.registerDeviceIfNotAlready = registerDeviceIfNotAlready;
exports.connectToDB = connectToDB;
exports.parseRequest	= parseRequest;
exports.checkDataIDs = checkDataIDs;
exports.uploadFile = uploadFile;
exports.uploadDataPoint = uploadDataPoint;
exports.generateSuccessResponse = generateSuccessResponse;