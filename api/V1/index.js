/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const fs = require("fs");
const path = require("path");

module.exports = function(app) {
  const apiRouts = fs.readdirSync(__dirname);

  // Remove files that are not added to app directly
  apiRouts.splice(apiRouts.indexOf("index.js"), 1);
  apiRouts.splice(apiRouts.indexOf("util.js"), 1);
  apiRouts.splice(apiRouts.indexOf("responseUtil.js"), 1);
  apiRouts.splice(apiRouts.indexOf("recordingUtil.js"), 1);
  apiRouts.splice(apiRouts.indexOf("apidoc.js"), 1);

  for (const i in apiRouts) {
    require(path.join(__dirname, apiRouts[i]))(app, "/api/v1");
  }
};
