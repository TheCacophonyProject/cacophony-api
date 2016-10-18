var fs = require('fs');
var path = require('path');

module.exports = function(app) {

  app.get('/', function(req, res) {
    res.render('home.jade')
  });

  app.get('/get_audio_recordings', function(req, res) {
    res.render('getAudioRecordings.jade')
  });

  app.get('/get_ir_video_recordings', function(req, res) {
    res.render('getIrVideoRecordings.jade')
  });

  app.get('/register', function(req, res) {
    res.render('register.jade')
  })

  app.get('/user_home', function(req, res) {
    res.render('userHome.jade')
  })

  app.get('/get_thermal_video_recordings', function(req, res) {
    res.render('getThermalVideoRecordings.jade')
  })

  var apiRouts = fs.readdirSync(__dirname);
  apiRouts.splice(apiRouts.indexOf('index.js'), 1); // Remove self from list.
  for (i in apiRouts) require(path.join(__dirname, apiRouts[i]))(app);
}
