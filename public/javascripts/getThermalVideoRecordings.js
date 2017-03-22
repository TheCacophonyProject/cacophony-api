function getTableData() {
  return [{
      tableName: "ID",
      modelField: "id",
      parseFunction: queryUtil.parseNumber
    },
    {
      tableName: "Group",
      modelField: "group",
      parseFunction: queryUtil.parseGroup
    },
    {
      tableName: "Device ID",
      modelField: "deviceId",
      parseFunction: queryUtil.parseNumber
    },
    {
      tableName: "Location",
      modelField: "location",
      parseFunction: queryUtil.parseLocation
    },
    {
      tableName: "Time",
      modelField: "recordingTime",
      parseFunction: queryUtil.parseTimeOnly
    },
    {
      tableName: "Date",
      modelField: "recordingDateTime",
      parseFunction: queryUtil.parseDateOnly
    },
    {
      tableName: "Duration",
      modelField: "duration",
      parseFunction: queryUtil.parseDuration
    },
    {
      tableName: "BatteryLevel",
      modelField: "batteryLevel",
      parseFunction: queryUtil.parseNumber
    },
    {
      tableName: "BatteryCharging",
      modelField: "batteryCharging",
      parseFunction: queryUtil.parseString,
    },
    {
      tableName: "AirplaneMode",
      modelField: "airplaneModeOn",
      parseFunction: queryUtil.parseBoolean,
    },
    {
      tableName: "File",
      modelField: "id",
      parseFunction: queryUtil.parseDownload
    }
  ];
}

var apiUrl = "api/v1/thermalVideoRecordings";
var viewUrl = '/view_thermal_video_recording/';
