var	orm = require('../models/orm');
var	log = require('../logging');
var VideoRecording = require('../models/videoRecording')
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

  app.get('/ping', function(request, response) {
    log.debug("Ping!");
    response.end('pong');
  })

  app.get('/testVideoView', function(request, response) {
    log.debug("Video test.");
    response.render('testVideoView.jade');
  })

  app.get('/ViewVideo/:id', function(request, response) {
    var id = request.params.id;
    log.debug("Video view, id:", id);
    var vr = new VideoRecording();
    vr.query({'id':id}, 1)
    .then(function(result) {
      log.debug("Rendering Video recording.");
      console.log(result)
      response.render('viewVideoRecording.jade', {'video':JSON.stringify(result[0])})
    })
    .catch(function(err) {
      log.error("Error:", err);
      response.status(400);
      res.end("Error with query:", err);
    })
  })
}
