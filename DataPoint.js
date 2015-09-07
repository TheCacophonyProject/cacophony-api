//DataPoint.
//This is an function that holds the relevent data of a single data point (recording) and is what will be passes between.
//The data point takes two parameters json and file.
//json: The JSON of the meta data of the data point, formated as shown below
//	{hardware: 	{key1:val1, key2:val2...},
//	software: 	{key1:val1, key2:val2...},
//	location:	{key1:val1, key2:val2...},
//	marin_data:	{key1:val1, key2:val2...}}
//
//file: The file of the data point (the recording)

module.exports = function(json, file) {

this.dataBase;			//connection to the PostgreSQL DB. 
this.postgreSQL;		//The PostgreSQL data base connection that the data point will be uploaded to.
this.fileName = file.name;		//The file to be uploaded.
fileExtension = this.fileName.substr(this.fileName.lastIndexOf('.')+1);	
this.tempFilePath = file.path;

this.checkedHardwareId = false;
this.checkedSoftwareId = false;
this.checkedLocationId = false;

this.newHardwareId = false;
this.newSoftwareId = false;
this.newLocationId = false;

this.uploaded = false;

//Parsing JSON
this.json = json;
this.hardware = json.hardware;	//JSON object that holds the device dardware info.
this.software = json.software;	//JSON object that holds the device software info.
this.location = json.location;	//JSON object that holds the location info.
this.mainData = json.main_data;	//JSON object containing the main data of the data point object.

this.deviceId;
if (json.device_id) {
	this.deviceId = json.device_id;	//ID of the device that was given to the device when it registered.
}

//TODO check if DataPoint is valid or not at this point.
console.log("New DataPoint created.");


//Generates a SQL insert query statement for the hardware talbe in the PostgreSQL database.
this.getHardwareInsert = function(){
	var colums = [];
	var values = [];

	for (var key in this.hardware){
		switch (key.toLowerCase()){
			case 'model':
				colums.push('model');
				values.push("'"+this.hardware[key]+"'");
				break;
			case 'manufacturer':
				colums.push('manufacturer');
				values.push("'"+this.hardware[key]+"'");
				break;
			case 'brand':
				colums.push('brand');
				values.push("'"+this.hardware[key]+"'");
				break;	
			default:
				//TODO throw error maybe?				
				console.log('ERROR! Unrecognised key', key);
				break;
		}
	}
	return "INSERT INTO hardware ("+colums.join(', ')+") VALUES ("+values.join(', ')+")";
}

//Generates a SQL insert query statement for the software talbe in the PostgreSQL database.
this.getSoftwareInsert = function(){
	var colums = [];
	var values = [];

	for (var key in this.software){
		switch (key.toLowerCase()){
			case 'os_codename':
				colums.push('os_codename');
				values.push("'"+this.software[key]+"'");
				break;
			case 'os_incremental':
				colums.push('os_incremental');
				values.push("'"+this.software[key]+"'");
				break;
			case 'sdk_int':
				colums.push('sdk_int');
				values.push("'"+this.software[key]+"'");
				break;
			case 'os_release':
				colums.push('os_release');
				values.push("'"+this.software[key]+"'");
				break;
			default:
				//TODO throw error maybe?				
				console.log('ERROR! Unrecognised key in SOFTWARE', key);
				break;
		}
	}
	return "INSERT INTO software ("+colums.join(', ')+") VALUES ("+values.join(', ')+")";
}

//Generates a SQL insert query statement for the location talbe in the PostgreSQL database.
this.getLocationInsert = function(){
	var colums = [];
	var values = [];

	for (var key in this.location){
		switch (key.toLowerCase()){
			case 'longitude':
				colums.push('longitude');
				values.push(this.location[key]);
				break;
			case 'latitude':
				colums.push('latitude');
				values.push(this.location[key]);
				break;
			case 'utc':
				colums.push('utc');
				values.push(this.location[key]);
				break;
			case 'altitude':
				colums.push('altitude');
				values.push(this.location[key]);
				break;
			case 'user_location_input':
				colums.push('user_location_input');
				values.push("'"+this.location[key]+"'");
				break;
			case 'accuracy':
				colums.push('accuracy');
				values.push(this.location[key]);
				break;
			default:
				//TODO throw error maybe?			
				console.log('ERROR! Unrecognised key in location', key);
				break;
		}
	}
	return "INSERT INTO location ("+colums.join(', ')+") VALUES ("+values.join(', ')+")";
}

//Generates a SQL insert query statement for the data_point talbe in the PostgreSQL database.
this.getDataPointInsert = function(){
	if (!this.readyForUpload()){ return null; } 		//This checks that the data point is generate the SQL insert statement

	var colums = ['device_id', 'hardware_id', 'software_id', 'location_id', 'file_name'];
	var values = [this.deviceId, this.hardware.id, this.software.id, this.location.id, "'"+this.getFileName()+"'"];

	for (var key in this.mainData){
		switch (key.toLowerCase()){
			case 'file_extension':
				colums.push('file_extension');
				values.push("'"+this.mainData[key]+"'");
				break;
			case 'bit_rate':
				colums.push('bit_rate');
				values.push("'"+this.mainData[key]+"'");
				break;
			case 'start_time_utc':
				colums.push('start_time_utc');
				values.push(this.mainData[key]);
				break;
			case 'duration':
				colums.push('duration');
				values.push("'"+this.mainData[key]+"'");
				break;
			default:
				//TODO throw error maybe?				
				console.log('ERROR! Unrecognised key in MAIN_DATA', key);
				break;
		}
	}
	return "INSERT INTO data_point ("+colums.join(', ')+") VALUES ("+values.join(', ')+")";
}

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
		if (!this.deviceId)		{ console.log("Invalid device id", this.deviceId) }
		if (!this.checkedHardwareId) { console.log("Hardware ID has not been validated") }
		if (!this.checkedSoftwareId) { console.log("Software ID has not been validated") }
		if (!this.checkedLocationId) { console.log("Location ID has not been validated.") }
		return false;
	}
}

//Get File Name: This function return the name/key that will be used when storing a file in the AWS S3. 
this.getFileName = function(){
	var fileName = null;
	if (this.deviceId && this.mainData.start_time_utc && fileExtension){
		fileName = this.deviceId + "/" + this.mainData.start_time_utc + "." + fileExtension;
	} else {
		console.log("Error, invalid DEVICE_ID and/or START_TIME_UTC and/or FILE_EXTENSION.");
	}
	return fileName;
}

this.isValid = function(){
	if (hardware && software && location && mainData && file){
		//TODO add more validation checks
		return true;
	} else {
		if (!this.hardware) { console.log("Hardware is invalid", this.hardware); }
		if (!this.software) { console.log("Software is invalid", this.software); }
		if (!this.location) { console.log("Location is invalid", this.location); }
		if (!this.mainData) { console.log("MainData is invalid", this.mainData); }
		if (!file) {console.log("File is invalid", file); }
		return false; 
	}
}
};











