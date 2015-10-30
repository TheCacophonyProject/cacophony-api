var DataPoint = require('./DataPoint'),
	config = require('./config'),
	Promise = require('bluebird'),
	pg = require('pg'),
	formidable = require('formidable'),
	knox = require('knox'),
	log = require('./logging');


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
	var filePath = dataPoint.getFilePath();
	log.debug("Uploading file as:", filePath);
	client.putFile(tempFilePath, filePath, function(err, res){
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
	return JSON.stringify(jsonResponse);
}

function uploadDataPoint(dataPoint) {
return new Promise(function(resolve, reject) {
	for (var model in dataPoint.childModels) {
		var modelName =  dataPoint.childModels[model].__options.name.singular;
		var id = dataPoint.childModels[model].dataValues.id;
		dataPoint.parentModel.setDataValue(modelName+'_id', id);
	}
	dataPoint.parentModel.save()
	.then(function(result) {
		log.info("Uploaded dataPoint.");
		resolve(dataPoint);
	})
	.error(function(er) {
		log.error('Error with uploading dataPoint.');
		reject(err);
	});
});
}

function equivalentModels(model1, model2){
	var values1 = model1.dataValues;
	var values2 = model2.dataValues;
	delete values1.createdAt;
	delete values1.updatedAt;
	delete values2.createdAt;
	delete values2.updatedAt;
	for (var key in values1) {
		if (typeof values1[key] == 'object' && values1[key] != null) {
			if (!equivalentJSON(values1[key], values2[key])){
				return false;
			}
		}
		else if (values1[key] != values2[key]) {
			return false;
		}
	}
	for (var key in values2) {
		if (typeof values2[key] == 'object' && values2[key] != null) {
			if (!equivalentJSON(values1[key], values2[key])){
				return false;
			}
		}
		else if (values1[key] != values2[key]) {
			return false;
		}
	}
	return true;
}

function equivalentJSON(json1, json2){
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

exports.uploadDataPoint = uploadDataPoint;
exports.registerDeviceIfNotAlready = registerDeviceIfNotAlready;
exports.uploadFile = uploadFile;
exports.generateSuccessResponse = generateSuccessResponse;
exports.equivalentModels = equivalentModels;
