window.onload = function(){
  console.log(recording);

  // Load recording if fileURL is set.
  if (recording.fileUrl) {
    var player = document.getElementById('player');
    var source = document.createElement('source');
    source.src = recording.fileUrl;
    player.appendChild(source);
  }

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
