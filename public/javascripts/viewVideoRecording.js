window.onload = function(){
  console.log('test1');
  console.log(video);
  var videoPlayer = document.getElementById('video-player');
  var videoSource = document.createElement('source');
  var videoFileURI = "https://cacophonytestbucket1.s3-us-west-2.amazonaws.com"+"/"+video.videoFileId.fileLocation;
  console.log (videoFileURI);
  videoSource.src = videoFileURI;
  videoPlayer.appendChild(videoSource);
  console.log(videoPlayer);

  document.getElementById('time-text').innerHTML = getStartTimeText();
  document.getElementById('date-text').innerHTML = getRecordingDateText();
  document.getElementById('location-text').innerHTML = getLocationText();
  document.getElementById('tags-text').innerHTML = getTagsText();
}

function getRecordingDateText() {
  if (video.videoFileId && video.videoFileId.recordingDateTime) {
    return video.videoFileId.recordingDateTime;
  } else {
    return "No recording date given."
  }
}

function getStartTimeText() {
  if (video.videoFileId && video.videoFileId.startTimestamp) {
    return video.videoFileId.startTimestamp;
  } else {
    return "No start time given."
  }
}

function getLocationText(){
  if (video.locationId) {
    return "Latitude: " + video.locationId.latitude + "  Longitude: " + video.locationId.longitude;
  } else {
    return "No location info given."
  }
}

function getTagsText() {
  if (video.tags) {
    return JSON.stringify(video.tags);
  } else {
    return "No tags for recording."
  }
}
