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

var mime = require('mime');
var moment = require('moment-timezone');
var Sequelize = require('sequelize');
const Op = Sequelize.Op;

var util = require('./util/util');
var validation = require('./util/validation');


module.exports = function(sequelize, DataTypes) {
  var name = 'Recording';

  var attributes = {
    // recording metadata.
    type: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    recordingDateTime: DataTypes.DATE,
    location: {
      type: DataTypes.GEOMETRY,
      set: util.geometrySetter,
      validate: { isLatLon: validation.isLatLon },
    },
    relativeToDawn: DataTypes.INTEGER,
    relativeToDusk: DataTypes.INTEGER,
    version: DataTypes.STRING,
    additionalMetadata: DataTypes.JSONB,
    comment: DataTypes.STRING,
    public: { type: DataTypes.BOOLEAN, defaultValue: false},

    // Raw file data.
    rawFileKey: DataTypes.STRING,
    rawFileSize: DataTypes.INTEGER,
    rawMimeType: DataTypes.STRING,

    // Processing fields. Fields set by and for the processing.
    fileKey: DataTypes.STRING,
    fileSize: DataTypes.STRING,
    fileMimeType: DataTypes.STRING,
    processingStartTime: DataTypes.DATE,
    processingMeta: DataTypes.JSONB,
    processingState: DataTypes.STRING,
    passedFilter: DataTypes.BOOLEAN,
    jobKey: DataTypes.STRING,

    // Battery relevant fields.
    batteryLevel: DataTypes.DOUBLE,
    batteryCharging: DataTypes.STRING,
    airplaneModeOn: DataTypes.BOOLEAN,
  };

  var Recording = sequelize.define(name, attributes);

  //---------------
  // CLASS METHODS
  //---------------
  var models = sequelize.models;

  Recording.addAssociations = function(models) {
    models.Recording.belongsTo(models.Group);
    models.Recording.belongsTo(models.Device);
    models.Recording.hasMany(models.Tag);
  };

  Recording.isValidTagMode = function(mode) { 
    return validTagModes.includes(mode); 
  };

  /**
    * Return one or more recordings for a user matching the query
    * arguments given.
    */
  Recording.query = async function(user, where, tagMode, tags, offset, limit, order) {
    if (order == null) {
      order = [
        // Sort by recordingDatetime but handle the case of the
        // timestamp being missing and fallback to sorting by id.
        [sequelize.fn("COALESCE", sequelize.col('recordingDateTime'), '1970-01-01'), "DESC"],
        ["id", "DESC"],
      ];
    }

    var q = {
      where: {
        [Op.and]: [
          where, // User query
          await recordingsFor(user),
          sequelize.literal(handleTagMode(tagMode)),
        ],
      },
      order: order,
      include: [
        { model: models.Group },
        { model: models.Tag, where: makeTagsWhere(tags) },
        { model: models.Device, where: {}, attributes: ["devicename", "id"] },
      ],
      limit: limit,
      offset: offset,
      attributes: this.userGetAttributes,
    };
    return this.findAndCount(q);
  };

  // local
  var handleTagMode = (tagMode) => {
    switch (tagMode) {
    case 'any':
      return '';
    case 'untagged':
      return 'NOT EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id)';
    case 'tagged':
      return 'EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id)';
    case 'no-human':
      return `NOT EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id AND NOT automatic)`;
    case 'automatic-only':
      return `EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id AND automatic)
              AND NOT EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id AND NOT automatic)`;
    case 'human-only':
      return `EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id AND NOT automatic)
              AND NOT EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id AND automatic)`;
    case 'automatic+human':
      return `EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id AND automatic)
              AND EXISTS (SELECT * FROM "Tags" WHERE  "Tags"."RecordingId" = "Recording".id AND NOT automatic)`;
    default:
      throw `invalid tag mode: ${tagMode}`;
    }
  };

  // local
  var makeTagsWhere = (tags) => {
    if (!tags || tags.length === 0) {
      return null;
    }

    var parts = [];
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      switch (tag) {
      case "interesting":
        parts.push({
          [Op.not]: {
            [Op.or]: [
              {animal: null, event: "false positive"},
              {animal: "bird"},
            ]},
        });
        break;
      default:
        parts.push({animal: tag});
      }
    }
    if (parts.Length == 1) {
      return parts[0];
    }
    return {[Op.or]: parts};
  };

  /**
   * Return a single recording for a user.
   */
  Recording.getOne = async function(user, id, type) {
    var query = {
      where: {
        [Op.and]: [
          { id: id },
          await recordingsFor(user),
        ],
      },
      include: [
        { model: models.Tag, },
        { model: models.Device, where: {}, attributes: ["devicename", "id"] },
      ],
      attributes: this.userGetAttributes.concat(['rawFileKey']),
    };
    if (type) {
      query.where[Op.and].push({'type': type});
    }

    return await this.findOne(query);
  };

  /**
   * Deletes a single recording if the user has permission to do so.
   */
  Recording.deleteOne = async function(user, id) {
    var recording = await this.getOne(user, id);
    if (recording == null) {
      return false;
    }
    var userPermissions = await recording.getUserPermissions(user);
    if (userPermissions.canDelete != true) {
      return false;
    } else {
      await recording.destroy();
      return true;
    }
  };

  /**
   * Updates a single recording if the user has permission to do so.
   */
  Recording.updateOne = async function(user, id, updates) {
    for (var key in updates) {
      if (apiUpdatableFields.indexOf(key) == -1) {
        return false;
      }
    }
    var recording = await this.getOne(user, id);
    if (recording == null) {
      return false;
    }
    var userPermissions = await recording.getUserPermissions(user);
    if (userPermissions.canUpdate != true) {
      return false;
    } else {
      await recording.update(updates);
      return true;
    }
  };

  // local
  var recordingsFor = async function(user) {
    if (user.superuser) {
      return null;
    }
    var deviceIds = await user.getDeviceIds();
    var groupIds = await user.getGroupsIds();
    return {[Op.or]: [
      {public: true},
      {GroupId: {[Op.in]: groupIds}},
      {DeviceId: {[Op.in]: deviceIds}},
    ]};
  };

  //------------------
  // INSTANCE METHODS
  //------------------

  Recording.prototype.getFileBaseName = function() {
    return moment(new Date(this.recordingDateTime)).tz("Pacific/Auckland")
      .format("YYYYMMDD-HHmmss");
  };

  Recording.prototype.getRawFileName = function() {
    return this.getFileBaseName() + this.getRawFileExt();
  };

  Recording.prototype.getFileName = function() {
    return this.getFileBaseName() + this.getFileExt();
  };
  
  Recording.prototype.getRawFileExt = function() {
    if (this.rawMimeType == 'application/x-cptv') {
      return ".cptv";
    }
    const ext = mime.getExtension(this.rawMimeType);
    if (ext) {
      return '.' + ext;
    }
    switch (this.type) {
    case 'thermalRaw':
      return '.cptv';
    case 'audio':
      return '.mpga';
    default:
      return "";
    }
  };

  /**
   * Returns JSON describing what the user can do to the recording.
   * Permission types: DELETE, TAG, VIEW,
   * //TODO This will be edited in the future when recordings can be public.
   */
  Recording.prototype.getUserPermissions = function(user) {
    // superusers can do everything.
    if (user.superuser) {
      return {
        canDelete: true,
        canTag: true,
        canView: true,
        canUpdate: true,
      };
    }

    // For now if the user is in the group that owns the recording they have all
    // permission. This will be changed in the future.
    var permissions = {
      canDelete: false,
      canTag: false,
      canView: false,
      canUpdate: false,
    };

    return new Promise(async (resolve) => {
      var groupIds = await user.getGroupsIds();
      if (groupIds.indexOf(this.GroupId) !== -1) {
        permissions.canDelete = true;
        permissions.canTag = true;
        permissions.canView = true;
        permissions.canUpdate = true;
      }
      return resolve(permissions);
    });
  };
  
  Recording.prototype.getFileExt = function() {
    if (this.fileMimeType == 'video/mp4') {
      return ".mp4";
    }
    const ext = mime.getExtension(this.fileMimeType);
    if (ext) {
      return "." + ext;
    }
    return "";
  };

  Recording.userGetAttributes = [
    'id',
    'rawFileSize',
    'rawMimeType',
    'fileSize',
    'fileMimeType',
    'processingState',
    'duration',
    'recordingDateTime',
    'relativeToDawn',
    'relativeToDusk',
    'location',
    'version',
    'batteryLevel',
    'batteryCharging',
    'airplaneModeOn',
    'type',
    'additionalMetadata',
    'GroupId',
    'fileKey',
    'comment',
  ];
  
  Recording.apiSettableFields = [
    'type',
    'duration',
    'recordingDateTime',
    'relativeToDawn',
    'relativeToDusk',
    'location',
    'version',
    'batteryCharging',
    'batteryLevel',
    'airplaneModeOn',
    'additionalMetadata',
    'processingMeta',
    'comment',
  ];

  // local
  var apiUpdatableFields = [
    'location',
    'comment',
    'additionalMetadata',
  ];
  
  Recording.processingStates = {
    thermalRaw: ['toMp4', 'FINISHED'],
    audio: ['toMp3', 'FINISHED'],
  };
  
  Recording.processingAttributes = [
    'id',
    'type',
    'jobKey',
    'rawFileKey',
    'rawMimeType',
    'fileKey',
    'fileMimeType',
    'processingState',
    'processingMeta',
  ];
  
  // local
  const validTagModes = Object.freeze([
    'any',
    'untagged',
    'tagged',
    'no-human',  // untagged or automatic only
    'automatic-only',
    'human-only',
    'automatic+human',
  ]);
  
  return Recording;
};
