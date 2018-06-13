var util = require('./util/util');
var validation = require('./util/validation');
var moment = require('moment-timezone');

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

  var models = sequelize.models;

  /**
    * Return one or more recordings for a user matching the query
    * arguments given.
    */
  var query = async function(user, where, tagMode, tags, offset, limit, order) {
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
        "$and": [
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
      attributes: userGetAttributes,
    };
    return this.findAndCount(q);
  };

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
          "$not": {
            "$or": [
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
    return {"$or": parts};
  };

  /**
   * Return a single recording for a user.
   */
  var getOne = async function(user, id) {
    var query = {
      where: {
        "$and": [
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

    return await this.findOne(query);
  };

  /**
   * Deletes a single recording if the user has permission to do so.
   */
  var deleteOne = async function(user, id) {
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
  var updateOne = async function(user, id, updates) {
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

  var recordingsFor = async function(user) {
    if (user.superuser) {
      return null;
    }
    var deviceIds = await user.getDeviceIds();
    var groupIds = await user.getGroupsIds();
    return {"$or": [
      {public: true},
      {GroupId: {"$in": groupIds}},
      {DeviceId: {"$in": deviceIds}},
    ]};
  };

  var getRawFileName = function() {
    var ext = '';
    if (this.type == 'thermalRaw') {
      ext = '.cptv';
    }
    return moment.tz('Pacific/Auckland').format('YYYYMMDD-HHmmss') + ext;
  };

  var options = {
    classMethods: {
      addAssociations: addAssociations,
      query: query,
      getOne: getOne,
      deleteOne: deleteOne,
      updateOne: updateOne,
      processingAttributes: processingAttributes,
      processingStates: processingStates,
      apiSettableFields: apiSettableFields,
      userGetAttributes: userGetAttributes,
      isValidTagMode: function(mode) { return validTagModes.includes(mode); },
    },
    instanceMethods: {
      canGetRaw: canGetRaw,
      getFileName: getFileName,
      getRawFileName: getRawFileName,
      getUserPermissions: getUserPermissions,
    },
  };

  return sequelize.define(name, attributes, options);
};

/**
 * Returns JSON describing what the user can do to the recording.
 * Permission types: DELETE, TAG, VIEW,
 * //TODO This will be edited in the future when recordings can be public.
 */
function getUserPermissions(user) {
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
}

function canGetRaw() {
  if (this.get('type') == 'thermalRaw') {
    return true;
  }
  return false;
}

function getFileName() {
  var ext = "";
  if (this.fileMimeType == 'video/mp4') {
    ext = ".mp4";
  }
  return moment(new Date(this.recordingDateTime)).tz("Pacific/Auckland")
    .format("YYYYMMDD-HHmmss") + ext;
}

var userGetAttributes = [
  'id',
  'rawFileSize',
  'fileSize',
  'fileMimeType',
  'processingState',
  'duration',
  'recordingDateTime',
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

var apiSettableFields = [
  'type',
  'duration',
  'recordingDateTime',
  'location',
  'version',
  'batteryCharging',
  'batteryLevel',
  'airplaneModeOn',
  'additionalMetadata',
  'processingMeta',
  'comment',
];

var apiUpdatableFields = [
  'location',
  'comment',
];

var processingStates = {
  thermalRaw: ['toMp4', 'FINISHED'],
};

var processingAttributes = [
  'id',
  'rawFileKey',
  'fileKey',
  'processingMeta',
  'processingState',
  'jobKey',
  'type',
];

const validTagModes = Object.freeze([
  'any',
  'untagged',
  'tagged',
  'no-human',  // untagged or automatic only
  'automatic-only',
  'human-only',
  'automatic+human',
]);

function addAssociations(models) {
  models.Recording.belongsTo(models.Group);
  models.Recording.belongsTo(models.Device);
  models.Recording.hasMany(models.Tag);
}
