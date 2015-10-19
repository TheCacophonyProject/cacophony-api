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
assert.equal(typeof file.path, 'string', 'file path was not a string');
assert.equal(typeof json.mainData, 'object', 'Invalid mainData field.');
assert.equal(typeof json.mainData.fileName, 'string', 'fileName in mainData was not a String.');
assert.equal(typeof json.mainData.deviceId, 'number', 'deviceId in mainData was not a number.');
assert.equal(typeof json.location, 'object', 'Invalid location field.');
assert.equal(typeof json.hardware, 'object', 'Invalid hardware field.');
assert.equal(typeof json.software, 'object', 'Invalid software field.');

this.filePath = file.path;
this.fileName = json.mainData.fileName;
this.deviceId = json.mainData.deviceId;
this.hardware = json.hardware;
this.software = json.software;
this.location = json.location;
this.mainData = json.mainData;
this.fileType;
if (typeof json.mainData.fileType == 'string') {
	this.fileType = json.mainData.fileType;
} else if (this.fileName.lastIndexOf('.') != -1) {
	this.fileType = this.fileName.substr(this.fileName.lastIndexOf('.')+1);
} else {
	assert(false, 'Can\'t find file type.');
}

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
