window.onload = function() {
  var headers = { where: '{"id": ' + id + '}' };
  var jwt = sessionStorage.getItem('token');
  if (jwt) {
    headers.Authorization = jwt;
  }
  $.ajax({
    url: apiUrl,
    type: 'get',
    headers: headers,
    success: requestSuccess,
    error: requestError
  });
  getPlayerSource(document.getElementById('player')); // Gets a tempory URL (10 minutes) that can be used as the audio source
};

var recording = null;

function requestError(err) {
  console.log(err);
  window.alert(err);
}

function requestSuccess(res) {
  console.log(res);
  recording = res.result.rows[0];

  document.getElementById('time-text').innerHTML = getStartTimeText();
  document.getElementById('date-text').innerHTML = getRecordingDateText();
  document.getElementById('location-text').innerHTML = getLocationText();
  document.getElementById('tags-text').value = getTagsText();
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

function getTagsText() {
  if (recording.tags) {
    return JSON.stringify(recording.tags);
  } else {
    return "No tags for recording.";
  }
}

function getPlayerSource(player) {
  var source = document.createElement('source');

  var headers = {};
  var jwt = sessionStorage.getItem('token');
  if (jwt) {
    headers.Authorization = jwt;
  }
  $.ajax({
    url: apiUrl + "/" + id,
    type: 'get',
    headers: headers,
    success: function(response) {
      var src = "/api/v1/signedUrl?jwt=" + response.jwt;
      source.src = src;
      player.appendChild(source);
    },
    error: function(err) {
      console.log("Error with getting temp file url.", err);
    }
  });
}
