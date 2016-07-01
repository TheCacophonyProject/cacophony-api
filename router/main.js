var	orm = require('../models/orm');
var	log = require('../logging');

module.exports = function(app) {

  app.get('/',function(request, response){
    response.render('index.jade');
  });

  app.get('/upload', function(request, response) {
    log.debug("Get request for 'upload' was called.");
    response.render('upload.jade')
  });

  app.get('/GetAudioRecording', function(request, response) {
    log.debug("Get audio recording page");
    response.render('getAudioRecordings.jade')
  })

  app.get('/GetVideoRecording', function(request, response) {
    log.debug("Get video recording page");
    response.render('getVideoRecordings.jade')
  })
}
