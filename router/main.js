var util = require('../util'),
	dataValidation = require('../dataValidation'),
	orm = require('../orm'),
	log = require('../logging');

module.exports = function(app) {

  app.get('/',function(request, response){
      response.render('index.jade');
  });

  app.post('/upload',function(request, response) {
   	log.debug("Request handler 'upload' was called.");
   	log.info('Upload request started.');

   	dataValidation.validUploadRequest(request)
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
   		log.error('Error with upload:', err);
   		response.writeHead(400, {"Content-Type": "text/html"});
   		response.write('Error with processing request.');
   		response.end();
   	});
  });
}
