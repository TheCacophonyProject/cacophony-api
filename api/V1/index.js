var fs = require('fs');
var path = require('path');

module.exports = function(app) {
  var apiRouts = fs.readdirSync(__dirname);
  apiRouts.splice(apiRouts.indexOf('index.js'), 1); // Remove self from list.
  apiRouts.splice(apiRouts.indexOf('util.js'), 1); // Remove util from list.
  for (i in apiRouts) {
    require(path.join(__dirname, apiRouts[i]))(app, '/api/v1');
  }
}
