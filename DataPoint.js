//DataPoint.
//This is an function that holds the relevent data of a single data point (recording) and is what will be passes between.
//The data point takes two parameters json and file.
//json: The JSON of the meta data of the data point, formated as shown below
//	{hardware: 	{key1:val1, key2:val2...},
//	software: 	{key1:val1, key2:val2...},
//	location:	{key1:val1, key2:val2...},
//	mainData:	{key1:val1, key2:val2...}}
//
//file: The file of the data point (the recording)
var log = require('./logging'),
	orm = require('./orm'),
	assert = require('assert');

module.exports = function(json, file) {
//Checkiing json and file is valid
assert.equal(typeof json, 'object', 'json was invalid.');
assert.equal(typeof file, 'object', 'file invalid.');
assert.equal(typeof file.path, 'string', 'file path was not a string.');

this.parentModel = orm.parentModel.build();
if (json[orm.parentModel.name]) {
	this.parentModel.setFromJson(json[orm.parentModel.name]);
} else {
	throw {
		name: "Bad request",
		message: "No field in json for Model: " + orm.parentModel.name
	};
}

this.childModels = {};
this.validChildModels = {};

for (var i = 0; i < orm.childModels.length; i++) {
  var model = orm.childModels[i];
  if (json[model.name]) {
    var modelInstance = model.build();
    modelInstance.setFromJson(json[model.name]);
    this.childModels[model.name] = modelInstance;
		this.validChildModels[model.name] = false;
  } else {
		throw {
			name: "Bad request",
			message: "No field in json for Model: " + model.name
		};
  }
}

for (var model in this.childModels) {
	console.log(model, this.childModels[model].dataValues);
}
//console.log('childModels', this.childModels);
console.log('parentModel', this.parentModel.dataValues);

this.checkedHardwareId = false;
this.checkedSoftwareId = false;
this.checkedLocationId = false;

this.newHardwareId = false;
this.newSoftwareId = false;
this.newLocationId = false;

this.uploaded = false;
log.debug("New DataPoint created.");

//TODO This will return true if the datapoint is ready to upload the file (recording)
this.readyForFileUpload = function(){
	//TODO
	return true;
}

//TODO check that the data point s ready to be uploaded to the data base.
this.readyForUpload = function(){
	//TODO check that the file is valid
	if (this.deviceId && this.checkedHardwareId && this.checkedSoftwareId && this.checkedLocationId){
		return true;
	} else {
		if (!this.deviceId)		{ log.error("Device id not found. DataPoint not ready for upload.") }
		if (!this.checkedHardwareId) { log.error("Hardware ID has not been validated. DataPoint not ready for upload.") }
		if (!this.checkedSoftwareId) { log.error("Software ID has not been validated. DataPoint not ready for upload.") }
		if (!this.checkedLocationId) { log.error("Location ID has not been validated. DataPoint not ready for upload.") }
		return false;
	}
}

//Get File Name: This function return the name/key that will be used when storing a file in the AWS S3.
this.getFileName = function(){
	var fileName = null;
	if (this.deviceId && this.mainData.startTimeUtc && this.fileExtension){
		fileName = this.deviceId + "/" + this.mainData.startTimeUtc + "." + this.fileExtension;
	} else {
		log.error("Cannot generate file name. Invalid DEVICE_ID and/or START_TIME_UTC and/or FILE_EXTENSION.");
	}
	return fileName;
}

this.isValid = function(){
	if (hardware && software && location && mainData && file){
		//TODO add more validation checks
		return true;
	} else {
		if (!this.hardware) { log.error("Hardware is invalid", this.hardware); }
		if (!this.software) { log.error("Software is invalid", this.software); }
		if (!this.location) { log.error("Location is invalid", this.location); }
		if (!this.mainData) { log.error("MainData is invalid", this.mainData); }
		if (!file) { log.error("File is invalid", file); }
		return false;
	}
}
};
