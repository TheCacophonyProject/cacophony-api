var http = require("http");
var url = require("url");
var orm = require('./orm');
var config = require('./config');

function start(route, handle){

	function onRequest(request, response) {
		var pathname = url.parse(request.url).pathname;
		console.log("Request for " + pathname + " received.");
		route(handle, pathname, response, request);
	}

	console.log('Syncing to database.');
	orm.sync()
	.then(function() {
		console.log('Sync finished.')
		http.createServer(onRequest).listen(config.server.port);
		console.log("Server has started");
	});
}

exports.start = start;
