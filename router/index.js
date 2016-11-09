var fs = require('fs');
var path = require('path');

module.exports = function(app) {

  app.get('/', function(req, res) {
    res.render('home.pug');
  });

  app.get('/get_audio_recordings', function(req, res) {
    res.render('getAudioRecordings.pug');
  });

  app.get('/get_ir_video_recordings', function(req, res) {
    res.render('getIrVideoRecordings.pug');
  });

  app.get('/register', function(req, res) {
    res.render('register.pug');
  });

  app.get('/user_home', function(req, res) {
    res.render('userHome.pug');
  });

  app.get('/get_thermal_video_recordings', function(req, res) {
    res.render('getThermalVideoRecordings.pug');
  });

  app.get('/ping', function(req, res) {
    res.end("pong...");
  });

  app.get('/login', function(req, res) {
    res.render('login.pug');
  });

  app.get('/new_group', function(req, res) {
    res.render('newGroup.pug');
  });

  app.get('/view_audio_recording/:id', function(req, res) {
    res.render('viewAudioRecording.pug', { 'id': req.params.id });
  });

  app.get('/view_ir_video_recording/:id', function(req, res) {
    res.render('viewIrVideoRecording.pug', { 'id': req.params.id });
  });

  app.get('/view_thermal_video_recording/:id', function(req, res) {
    res.render('viewThermalVideoRecording.pug', { 'id': req.params.id });
  });

  //var apiRouts = fs.readdirSync(__dirname);
  //apiRouts.splice(apiRouts.indexOf('index.js'), 1); // Remove self from list.
  //for (var i in apiRouts) require(path.join(__dirname, apiRouts[i]))(app);
};
