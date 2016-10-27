var models = require('../models');
var passport = require('passport');
require('../passportConfig')(passport);

module.exports = function(app) {
  app.get('/view_thermal_video_recording/:id', function(req, res) {
    var id = req.params.id;
    models.ThermalVideoRecording.findAllWithUser(null, { where: { id: id } })
      .then(function(modelRes) {
        if (modelRes.length <= 0) {
          return res.status(400).json({message: "No recording found."});
        } else {
          var recording = JSON.stringify(modelRes[0].dataValues);
          res.render('viewThermalVideoRecording.pug', { 'recording': recording })
        }
      })
      .catch(function(err) {
        console.log(err);
      })
  });
}
