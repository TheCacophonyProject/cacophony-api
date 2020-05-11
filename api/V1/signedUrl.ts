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

import middleware from "../middleware";
import auth from "../auth";
import stream from "stream";
import config from "../../config";
import log from "../../logging";
import modelsUtil from "../../models/util/util";
import responseUtil from "./responseUtil";
import { ClientError } from "../customErrors";
import { Application } from "express";

export default function (app: Application, baseUrl: string) {
  /**
   * @api {get} /api/v1/signedUrl Get a file using a JWT
   * @apiName GetFile
   * @apiGroup SignedUrl
   *
   * @apiDescription Gets a file. The JWT for authentication may be
   * passed using a URL parameter or using the Authorization header
   * (as for other API endpoints).
   *
   * @apiParam {String} [jwt] the value of the downloadFileJWT field
   * from a successful [GetRecording](#api-Recordings-GetRecording)
   * request. Authentication using the Authorization header is also
   * supported.
   *
   * @apiSuccess {file} file Raw data stream of the file.
   *
   * @apiUse V1ResponseError
   */

  app.get(
    `${baseUrl}/signedUrl`,
    [auth.signedUrl],
    middleware.requestWrapper(async (request, response) => {
      const mimeType = request.jwtDecoded.mimeType || "";
      const filename = request.jwtDecoded.filename || "file";

      const key = request.jwtDecoded.key;
      if (!key) {
        throw new ClientError("No key provided.");
      }

      const s3 = modelsUtil.openS3();
      const params = {
        Bucket: config.s3.bucket,
        Key: key
      };

      s3.getObject(params, function (err, data) {
        if (err) {
          log.error("Error with s3 getObject.");
          log.error(err.stack);
          return responseUtil.serverError(response, err);
        }

        if (!request.headers.range) {
          response.setHeader(
            "Content-disposition",
            "attachment; filename=" + filename
          );
          response.setHeader("Content-type", mimeType);
          response.setHeader("Content-Length", data.ContentLength);
          response.write(data.Body, "binary");
          return response.end(null, "binary");
        }

        const range = request.headers.range;
        const positions = range.replace(/bytes=/, "").split("-");
        const start = parseInt(positions[0], 10);
        const total = (data.Body as Buffer).length;
        const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        const chunksize = end - start + 1;

        const headers = {
          "Content-Range": "bytes " + start + "-" + end + "/" + total,
          "Content-Length": chunksize,
          "Accept-Ranges": "bytes",
          "Content-type": mimeType
        };

        response.writeHead(206, headers);

        const bufStream = new stream.PassThrough();
        const b2 = (data.Body as Buffer).slice(start, end + 1);
        bufStream.end(b2);
        bufStream.pipe(response);
      });
    })
  );
}
