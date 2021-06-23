/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2019  The Cacophony Project

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
import { UserId as UserIdAlias } from "./User";
import { TrackId } from "./Track";
export const AI_MASTER = "Master";
export type TrackTagId = number;

export interface TrackTag extends Sequelize.Model, ModelCommon<TrackTag> {
  isAdditionalTag: () => boolean;
  id: TrackTagId;
  TrackId: TrackId;
  what: string;
  automatic: boolean;
  UserId: UserIdAlias;
  confidence: number;
  data: any;
}
export interface TrackTagStatic extends ModelStaticCommon<TrackTag> {}
export default function (
  sequelize: Sequelize.Sequelize,
  DataTypes
): TrackTagStatic {
  const additionalTags = Object.freeze(["poor tracking", "part"]);

  const TrackTag = sequelize.define("TrackTag", {
    what: DataTypes.STRING,
    confidence: DataTypes.FLOAT,
    automatic: DataTypes.BOOLEAN,
    data: DataTypes.JSONB
  }) as unknown as TrackTagStatic;

  //---------------
  // CLASS METHODS
  //---------------
  TrackTag.addAssociations = function (models) {
    models.TrackTag.belongsTo(models.Track);
    models.TrackTag.belongsTo(models.User);
  };

  TrackTag.apiSettableFields = Object.freeze(["what", "confidence", "data"]);

  TrackTag.userGetAttributes = Object.freeze(
    TrackTag.apiSettableFields.concat(["id"])
  );

  //---------------
  // INSTANCE
  //---------------

  TrackTag.prototype.isAdditionalTag = function () {
    return additionalTags.includes(this.what);
  };
  return TrackTag;
}
