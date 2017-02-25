function getTableData() {
  return [
    { tableName: "ID", modelField: "id", parseFunction: util.parseNumber },
    { tableName: "Group", modelField: "group", parseFunction: util.parseGroup },
    { tableName: "Device ID", modelField: "deviceId", parseFunction: util.parseNumber },
    { tableName: "Location", modelField: "location", parseFunction: util.parseLocation },
    { tableName: "Time", modelField: "recordingTime", parseFunction: util.parseTimeOnly },
    { tableName: "Date", modelField: "recordingDateTime", parseFunction: util.parseDateOnly },
    { tableName: "Duration", modelField: "duration", parseFunction: util.parseDuration },
    { tableName: "File", modelField: "id", parseFunction: util.parseDownload },
  ];
}

var apiUrl = "api/v1/audiorecordings";
var viewUrl = '/view_audio_recording/';
