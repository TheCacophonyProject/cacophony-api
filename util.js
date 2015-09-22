var DataPoint = require('./DataPoint'),
	config = require('./config'),
	Promise = require('bluebird'),
	pg = require('pg'),
	formidable = require('formidable'),
	knox = require('knox'),
	log = require('./logging');

//Parse Form: Takes a request and parses it into a DataPoint
function parseRequest(request){
return new Promise(function(resolve, reject) {
	var form = new formidable.IncomingForm();
	log.debug("About to parse incoming form.");

	form.parse(request, function(err, fields, files) {
		log.debug("Finsihed parsing form.");
		if (err) {
			log.error("Error when parsing form.");
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
		log.verbose('DataPoint had an id.');
		resolve(dataPoint);
	} else {
		//TODO register device
		log.info("Device is not registered, for now a device id of 1 will be given to it.");
		dataPoint.deviceId = 1;
		resolve(dataPoint);
	}
});
}

//Upload File:
//Uploads the file (recording) to the Amazon S3 service.
//Returns a Promise that resolves when the file (recording) finishes uploading.
//NOTE: Amazon S3 service is used at the moment but alternatives to Amazon should be looked into.
function uploadFile(dataPoint){
return new Promise(function(resolve, reject) {
	var client = knox.createClient({
		key: config.s3.publicKey
	  , secret: config.s3.privateKey
	  , bucket: config.s3.bucket
	  , region: config.s3.region
	});

	var tempFilePath = dataPoint.tempFilePath;
	var fileName = dataPoint.getFileName();
	log.debug("Uploading file as:", fileName);
	client.putFile(tempFilePath, fileName, function(err, res){
		if (err) {
			log.error("Error with uploading file.");
			reject(err);
		} else if (res.statusCode != 200) {
			log.error("Error with uploading file. Response code of:", res.statusCode);
			reject('Bad response code from S3 server:', res.statusCode);
		} else {
			resolve(dataPoint);
		}
	});
});
}


//Generate success response:
//Returns a JSON as a String that is to be sent back to the device (Cacophonometer) when the upload was a success.
//JSON includes new hardware, software and location IDs if there were new ones made.
//TODO there is probably a better way to send a JSON back to the device.
function generateSuccessResponse(dataPoint) {
	var jsonResponse = {response: 'success'};
	if(dataPoint.newId['hardware']){
		jsonResponse.newHardwareId = dataPoint.hardware.id;
	}
	if(dataPoint.newId['software']){
		jsonResponse.newSoftwareId = dataPoint.software.id;
	}
	if(dataPoint.newId['location']){
		jsonResponse.newLocationId = dataPoint.location.id;
	}
	return JSON.stringify(jsonResponse);
}

exports.registerDeviceIfNotAlready = registerDeviceIfNotAlready;
exports.parseRequest	= parseRequest;
exports.uploadFile = uploadFile;
exports.generateSuccessResponse = generateSuccessResponse;
