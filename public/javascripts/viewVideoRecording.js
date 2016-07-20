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
  document.getElementById('tags-text').value = getTagsText();
  $("#update-tags").click(updateTags);
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

function updateTags() {
  console.log("Update tags.");
  var tags = document.getElementById('tags-text').value;
  var id = video.id;
  try {
    JSON.parse(tags);
    console.log("ID", id);
    console.log("Tags", tags);
    tags = encodeURIComponent(tags);
    $.ajax({
      url: '/api/v1/videoRecordingsTags/'+id+"?type=replace&tags="+tags,
      type: 'PUT',
      success: updateTagsSuccess,
      error: updateTagsError
    });
  } catch (err) {
    console.log("Error with updating tags", err);
    window.alert("Error with updating tags: " +err);
  }
}

function updateTagsSuccess() {
  window.alert("Tags Updated.");
}

function updateTagsError(err) {
  window.alert("Error with updating tags: "+JSON.stringify(err));
}
