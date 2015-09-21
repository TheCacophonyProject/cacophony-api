var http = require("http"),
	url = require("url"),
	orm = require('./orm'),
	config = require('./config'),
	log = require('./logging');

function start(route, handle){

	function onRequest(request, response) {
		var pathname = url.parse(request.url).pathname;
		log.debug("Request for " + pathname + " received.");
		route(handle, pathname, response, request);
	}

	log.info('Syncing to database.');
	orm.sync()
	.then(function() {
		log.info('Sync to Database finished.')
		http.createServer(onRequest).listen(config.server.port);
		log.info("Server has started");
	});
}

exports.start = start;
