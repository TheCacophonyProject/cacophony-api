var util = require('./util');

//Home page
function start(response, request) {
	
	console.log("Request handler 'start' was called.");
	var body = "<h3>Cacophony server</h3>";

	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(body);
	response.end();
}

//test function! run some random code here to test!
function test(response, request) {
	var query = "SELECT * from test_table";	

	util.connectToDB()
	.then(queryDB(query, client)
	.then(console.log(result)));
}

//Upload page
function upload(response, request) {
	console.log("Request handler 'upload' was called.");

	util.parseRequest(request)				//parses a request and resolves the promise with a dataPoint
	.then(util.connectToDB)
	.then(util.registerDeviceIfNotAlready)
	.then(util.checkDataIDs)
	.then(util.uploadFile)
	.then(util.uploadDataPoint)
	.then(function(dataPoint){
		console.log("Responding to device.");
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(util.generateSuccessResponse(dataPoint));
		response.end(); 
		console.log("Responded back to device.")
		console.log();
	}).catch(function(err) {
		console.log("Error: ", err);
	});
}



exports.start = start;
exports.upload = upload;
exports.test = test;
