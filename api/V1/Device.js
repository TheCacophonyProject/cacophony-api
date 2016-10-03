var models = require('../../models');

module.exports = function(app, baseUrl) {
  var apiUrl = baseUrl + '/device';

  app.post(apiUrl, function(req, res) {
    // Check that required data is given.
    if (!req.body.devicename || !req.body.password) {
      var errMsgs = ["No 'devicename' or 'passowrd' field in body."];
      return res.json({ success: false, errorMessages: errMsgs});
    }

    //TODO check that the devicename is not allready used.

    // Create new device.
    models.Device.create({
        devicename: req.body.devicename,
        password: req.body.password
      })
      .then(function(device) { // Created new Device.
        util.handleResponse(res, {
          statusCode: 200,
          success: true,
          messages: ["Created new device."] //TODO add JWT for device.
        });
      })
      .catch(function(err) { // Error with creating Device.
        util.serverErrorResponse(res, err);
      });
  });
}
