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

import Sequelize from "sequelize";
import { ModelCommon, ModelStaticCommon } from "./index";
import { File, FileStatic } from "./File";

const Op = Sequelize.Op;
export type DetailSnapshotId = number;
export interface DetailSnapShot
  extends Sequelize.Model,
    ModelCommon<DetailSnapShot> {
  getFile: () => Promise<File>;
  id: DetailSnapshotId;
  type: string;
  details: any; // JSON
}

export interface DetailSnapshotStatic
  extends ModelStaticCommon<DetailSnapShot> {
  getOrCreateMatching: (searchType, searchDetails) => Promise<DetailSnapShot>;
  getFromId: (id: DetailSnapshotId) => Promise<DetailSnapShot>;
}

export default function (sequelize, DataTypes): DetailSnapshotStatic {
  const name = "DetailSnapshot";

  const attributes = {
    type: DataTypes.STRING,
    details: DataTypes.JSONB
  };

  const options = {};

  const DetailSnapshot = sequelize.define(
    name,
    attributes,
    options
  ) as unknown as DetailSnapshotStatic;

  const models = sequelize.models;

  //---------------
  // CLASS METHODS
  //---------------

  DetailSnapshot.addAssociations = function (models) {
    models.DetailSnapshot.hasMany(models.Event, {
      foreignKey: "EventDetailId"
    });
    models.DetailSnapshot.hasMany(models.Track, { foreignKey: "AlgorithmId" });
  };

  DetailSnapshot.getOrCreateMatching = async function (
    searchType,
    searchDetails
  ): Promise<DetailSnapShot> {
    if (!searchDetails) {
      searchDetails = {
        [Op.eq]: null
      };
    }

    const existing = await this.findOne({
      where: {
        type: searchType,
        details: {
          [Op.eq]: searchDetails // Need to specify the equal operator as it's a JSONB
        }
      }
    });

    if (existing) {
      return existing;
    } else {
      return this.create({
        type: searchType,
        details: searchDetails
      });
    }
  };

  DetailSnapshot.getFromId = async function (id: DetailSnapshotId) {
    return await this.findById(id);
  };

  //-----------------
  // INSTANCE METHODS
  //-----------------

  DetailSnapshot.prototype.getFile = async function () {
    const fid = this.details.fileId;
    if (!fid) {
      return null;
    }
    return (models.File as FileStatic).findByPk(fid);
  };

  return DetailSnapshot;
}
