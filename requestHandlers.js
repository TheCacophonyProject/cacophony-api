var util = require('./util'),
	dataValidation = require('./dataValidation'),
	orm = require('./orm'),
	log = require('./logging');

//Home page
function start(response, request) {

	log.debug("Request handler 'start' was called.");
	var body = "<h3>Cacophony server</h3>";

	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(body);
	response.end();
}

//Upload page
function upload(response, request) {
	log.debug("Request handler 'upload' was called.");
	log.info('Upload request started.')
	util.parseRequest(request)				//parses a request and resolves the promise with a dataPoint
	.then(util.registerDeviceIfNotAlready)
	.then(dataValidation.dataIDs)
	.then(util.uploadFile)
	.then(util.uploadDataPoint)
	.then(function(dataPoint){
		log.debug("Responding to device.");
		response.writeHead(200, {"Content-Type": "text/html"});
		var responseBody = util.generateSuccessResponse(dataPoint)
		response.write(responseBody);
		response.end();
		log.debug("Responded back to device.");
		log.verbose('Responded to device with:', responseBody);
	}).catch(function(err) {
		log.error("Error: ", err);
	});
	log.info('Upload request finished.');
}



exports.start = start;
exports.upload = upload;
