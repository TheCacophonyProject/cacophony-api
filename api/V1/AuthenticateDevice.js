var models = require('../../models');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var util = require('./util');
var responseUtil = require('./responseUtil');

module.exports = function(app) {
  app.post('/authenticate_device', function(req, res) {

    // Check that required data is given.
    if (!req.body.devicename || !req.body.password) {
      return responseUtil.send(res, {
        statusCode: 400,
        success: false,
        messages: ['Missing devicename or devicename.']
      });
    }

    models.Device.findOne({ where: { devicename: req.body.devicename } })
      .then(function(device) {
        // Return 401 if devicename is not found.
        if (!device) {
          return responseUtil.send(res, {
            statusCode: 401,
            success: false,
            messages: ["No device found with given devicename"]
          });
        }

        // Compare password.
        device.comparePassword(req.body.password)
          .then(function(passwordMatch) {
            // Password is valid, send JWT in response.
            if (passwordMatch) {
              var data = device.getJwtDataValues();
              var token = 'JWT ' + jwt.sign(data, config.passport.secret);
              return responseUtil.send(res, {
                statusCode: 200,
                success: true,
                messages: ["Successfull login."],
                token: token
              });
            } else {
              return responseUtil.send(res, {
                statusCode: 401,
                success: false,
                messages: ["Wrong password or devicename."]
              });
            }
          })
          .catch(function(err) {
            responseUtil.serverError(res, err);
          });
      })
      .catch(function(err) {
        responseUtil.serverError(res, err);
      });
  });
};
