var modelLayout = {
  id: {show: true},
  audioFileId: {
    _childModel: true,
    startTimestamp: {show: true},
    recordingDateTime: {show: true, parseFunction: parseRecordingDateTime},
    duration: {show: true, parseFunction: parseDuration},
    fileLocation: {show: true, parseFunction: parseFileLocation}
  },
  locationId: {
    _childModel: true,
    latitude: {show: false},
    longitude: {show: false}
  },
  tags: {show: true, parseFunction: parseTags}
}

var apiUrl = '/api/v1/audioRecordings';

function generateQuery() {
  console.log("Generating query.");
  var query = {};
  // Recording Time
  if ($("#start-time-check")[0].checked) {
    if (!query.audioFile) query.audioFile = {};
    query.audioFile.startTimestamp = {$gte: $("#start-time-start")[0].value, $lte: $("#start-time-end")[0].value};
  }
  // Recording Date
  if ($("#date-check")[0].checked) {
    if (!query.audioFile) query.audioFile = {};
    query.audioFile.recordingDateTime = {$gte: $("#date-start")[0].value, $lte: $("#date-end")[0].value};
  }
  // Recording Duration
  if ($("#duration-check")[0].checked) {
    if (!query.audioFile) query.audioFile = {};
    query.audioFile.duration = {$gte: $("#duration-min")[0].value, $lte: $("#duration-max")[0].value};
  }

  $("#query-input")[0].value = JSON.stringify(query);

}
