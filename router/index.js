var fs = require('fs');
var path = require('path');

module.exports = function(app) {

  app.get('/', function(req, res) {
    res.render('home.jade')
  });

  app.get('/GetAudioRecordings', function(req, res) {
    res.render('getAudioRecordings.jade')
  });

  app.get('/get_ir_video_recordings', function(req, res) {
    res.render('getIrVideoRecordings.jade')
  });



  var apiRouts = fs.readdirSync(__dirname);
  apiRouts.splice(apiRouts.indexOf('index.js'), 1); // Remove self from list.
  for (i in apiRouts) require(path.join(__dirname, apiRouts[i]))(app);
}
