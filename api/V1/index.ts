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

import { Application } from "express";
import fs from "fs";
import path from "path";

export default function (app: Application) {
  const excludedFiles = [
    "index.js",
    "util.js",
    "responseUtil.js",
    "recordingUtil.js",
    "eventUtil.js",
    "monitoringPage.js",
    "monitoringVisit.js",
    "apidoc.js"
  ];
  // Filter out files that are not added to app directly, and filter out typescript versions of files.
  const apiRoutes = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".js") && !excludedFiles.includes(file));

  for (const route of apiRoutes) {
    require(path.join(__dirname, route)).default(app, "/api/v1");
  }
}
