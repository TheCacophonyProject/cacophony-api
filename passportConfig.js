var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;
var AnonymousStrategy = require("passport-anonymous");
var models = require("./models");
var config = require("../../config");

module.exports = function(passport) {
  passport.use(new AnonymousStrategy());
  var opts = {
    jwtFromRequest: getJWT,
    secretOrKey: config.server.passportSecret
  };

  function getJWT(request) {
    if (request.query.jwt) {
      return ExtractJwt.fromUrlQueryParameter("jwt")(request);
    } else {
      return ExtractJwt.fromAuthHeaderWithScheme("jwt")(request);
    }
  }

  passport.use(
    new JwtStrategy(opts, function(jwt_payload, done) {
      if (!jwt_payload._type) {
        return done("No 'type' field in JWT.", false);
      }
      switch (jwt_payload._type) {
        case "user":
          validateUser(jwt_payload, done);
          break;
        case "device":
          validateDevice(jwt_payload, done);
          break;
        case "fileDownload":
          validateFileDownload(jwt_payload, done);
          break;
        default:
          return done("Unknown field type: " + jwt_payload._type, false);
      }
    })
  );
};

function validateUser(jwt_payload, done) {
  models.User.findOne({
    where: {
      id: jwt_payload.id
    }
  })
    .then(function(user) {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    })
    .catch(function(err) {
      return done(err, false);
    });
}

function validateDevice(jwt_payload, done) {
  models.Device.findOne({
    where: {
      id: jwt_payload.id
    }
  })
    .then(function(device) {
      if (device) {
        done(null, device);
      } else {
        done(null, false);
      }
    })
    .catch(function(err) {
      return done(err, false);
    });
}

function validateFileDownload(jwt_payload, done) {
  done(null, jwt_payload);
}
