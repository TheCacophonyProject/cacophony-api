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
import _ from "lodash";
import sequelize, { Order } from "sequelize";
import { AuthorizationError } from "../api/customErrors";
import { ModelCommon, ModelStaticCommon } from "./index";
import Sequelize from "sequelize";
import { User, UserId as UserIdAlias } from "./User";

const Op = sequelize.Op;
export type FileId = number;
export interface File extends Sequelize.Model, ModelCommon<File> {
  id: FileId;
  UserId: UserIdAlias;
  details: any;
  type: any;
  fileKey: string;
}
export interface FileStatic extends ModelStaticCommon<File> {
  buildSafely: (fields: Record<string, any>) => File;
  query: (
    where: any,
    offset: number,
    limit: number,
    order?: Order
  ) => Promise<{ rows: File[]; count: number }>;
  deleteIfAllowedElseThrow: (user: User, file: File) => Promise<void>;
  getMultiple: (ids: FileId[]) => Promise<File[]>;
}
export default function (sequelize, DataTypes) {
  const name = "File";

  const attributes = {
    type: DataTypes.STRING,
    fileKey: DataTypes.STRING,
    details: DataTypes.JSONB
  };

  const File = sequelize.define(name, attributes) as unknown as FileStatic;

  File.apiSettableFields = ["type", "details"];

  //---------------
  // CLASS METHODS
  //---------------

  File.buildSafely = function (fields) {
    return File.build(_.pick(fields, File.apiSettableFields)) as File;
  };

  File.addAssociations = function (models) {
    models.File.belongsTo(models.User);
  };

  /**
   * Return one or more files for a user matching the query
   * arguments given.
   */
  File.query = async function (where, offset, limit, order) {
    if (order == null) {
      order = [["id", "DESC"]];
    }

    const q = {
      where: where,
      order: order,
      attributes: { exclude: ["updatedAt", "fileKey"] },
      limit: limit,
      offset: offset
    };
    return this.findAndCountAll(q);
  };

  File.deleteIfAllowedElseThrow = async function (user, file) {
    if (!user.hasGlobalWrite() && user.id != file.UserId) {
      throw new AuthorizationError(
        "The user does not own that file and is not a global admin!"
      );
    }
    await file.destroy();
  };

  File.getMultiple = async function (ids) {
    return this.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
  };

  return File;
}
