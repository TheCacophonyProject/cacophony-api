var apiUrl = "/api/v1/irvideorecordings";
var recording = null;

window.onload = function() {
  var headers = { where: '{"id": ' + id + '}' };
  var jwt = sessionStorage.getItem('token');
  if (jwt) headers.Authorization = jwt;
  $.ajax({
    url: apiUrl,
    type: 'get',
    headers: headers,
    success: requestSuccess,
    error: requestError
  });
  // Get a tempory URL (10 minutes) that can be used as the audio source
  getPlayerSource(document.getElementById('player'));
  $("#delete-button").click(deleteDatapoint);
  tags.recordingsIds = { irVideoId: id };
};

function requestError(err) {
  console.log(err);
  window.alert(err);
}

function requestSuccess(res) {
  recording = res.result.rows[0];
  console.log(recording);
  document.getElementById('time-text').innerHTML = getStartTimeText();
  document.getElementById('date-text').innerHTML = getRecordingDateText();
  document.getElementById('location-text').innerHTML = getLocationText();
  tags.load(recording.tags);
}

function getAdditionalMetadataText() {
  return JSON.stringify(recording.additionalMetadata);
}

function getVersionNumberText() {
  return recording.version;
}

function getRelativeToDawnText() {
  return recording.relativeToDawn;
}

function getRelativeToDuskText() {
  return recording.relativeToDusk;
}

function getRecordingDateText() {
  return recording.recordingDateTime;
}

function getStartTimeText() {
  return recording.recordingTime;
}

function getLocationText() {
  return recording.location;
}

function getPlayerSource(player) {
  $.ajax({
    url: apiUrl + "/" + id,
    type: 'get',
    headers: { Authorization: sessionStorage.getItem('token') },
    success: function(response) {
      var source = document.createElement('source');
      source.src = "/api/v1/signedUrl?jwt=" + response.jwt;;
      player.appendChild(source);
    },
    error: function(err) { console.log(err); }
  });
}

function deleteDatapoint() {
  $.ajax({
    url: apiUrl + '/' + id,
    type: 'DELETE',
    headers: { Authorization: sessionStorage.getItem('token') },
    success: function() { window.alert("Datapoint deleted."); },
    error: function(err) {
      console.log(err);
      window.alert("Failed to delete datapoint.");
    }
  });
}
