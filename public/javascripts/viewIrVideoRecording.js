window.onload = function(){
  console.log(recording);
  var videoPlayer = document.getElementById('video-player');
  var videoSource = document.createElement('source');
  var videoFileUrl = recording.fileUrl;
  videoSource.src = videoFileUrl;
  videoPlayer.appendChild(videoSource);

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

function getLocationText(){
  return recording.location;
}

function getTagsText() {
  if (recording.tags) {
    return JSON.stringify(recording.tags);
  } else {
    return "No tags for recording."
  }
}
