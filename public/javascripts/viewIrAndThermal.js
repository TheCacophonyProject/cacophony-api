var irApiUrl = "/api/v1/irvideorecordings";
var thermalApiUrl = "/api/v1/thermalvideorecordings";
var signedUrl = '/api/v1/signedUrl?jwt=';

window.onload = function() {
  tags.recordingsIds = { thermalVideoId: thermalId, irVideoId: irId };
  var jwt = sessionStorage.getItem('token');
  var headers = {};
  if (jwt) headers.Authorization = jwt;

  // Load thermal metadata
  var thermalHeaders = headers;
  thermalHeaders.where = '{"id": ' + thermalId + '}';
  $.ajax({
    url: thermalApiUrl,
    type: 'get',
    headers: thermalHeaders,
    success: getThermalVideoSuccess,
    error: function(err) { console.log(err); }
  });

  // Load thermal video source
  $.ajax({
    url: thermalApiUrl + '/' + thermalId,
    type: 'get',
    headers: headers,
    success: getThermalVideoSourceSuccess,
    error: function(err) { console.log(err); }
  });

  // Load IR metadata
  var irHeaders = headers;
  irHeaders.where = '{"id": ' + irId + '}';
  $.ajax({
    url: irApiUrl,
    type: 'get',
    headers: irHeaders,
    success: getIrVideoSuccess,
    error: function(err) { console.log(err); }
  });

  // Load IR video source
  $.ajax({
    url: irApiUrl + '/' + irId,
    type: 'get',
    headers: headers,
    success: getIrVideoSourceSuccess,
    error: function(err) { console.log(err); }
  });
};

function getThermalVideoSuccess(res) {
  console.log("Get thermal video success", res);
  tags.load(res.result.rows[0].tags)
}

function getIrVideoSuccess(res) {
  console.log("Get IR video success", res);
}

function getThermalVideoSourceSuccess(res) {
  var themalVideoElement = document.getElementById('thermalVideo');
  themalVideoElement.addEventListener('loadedmetadata', function(res) {
    document.getElementById('videoSlider').max = themalVideoElement.duration;
    document.getElementById('videoSlider').oninput =
      themalVideoElement.sliderInput;
  });
  var source = document.createElement('source');
  source.setAttribute('src', signedUrl + res.jwt);
  themalVideoElement.appendChild(source);
  themalVideoElement.ontimeupdate = ontimeupdate;
}

function getIrVideoSourceSuccess(res) {
  var irVideoElement = document.getElementById('irVideo');
  var source = document.createElement('source');
  source.setAttribute('src', signedUrl + res.jwt);
  irVideoElement.appendChild(source);
}

function ontimeupdate() {
  if (document.getElementById('thermalVideo').paused) return;
  var t = document.getElementById('thermalVideo').currentTime;
  document.getElementById('videoSlider').value = t;
  document.getElementById('videoTime').innerHTML = Math.floor(t);
};

// Video controls
function playPause(button) {
  console.log('Play/Pause');
  var thermalVideo = document.getElementById('thermalVideo');
  var irVideo = document.getElementById('irVideo');
  if (thermalVideo.paused === true) {
    console.log('playing');
    thermalVideo.play();
    irVideo.play();
    button.innerHTML = 'Pause';
  } else {
    console.log('pausing');
    thermalVideo.pause();
    irVideo.pause();
    button.innerHTML = 'Play';
  }
};

function videoBack() {
  setTime(document.getElementById('thermalVideo').currentTime - 1);
};

function videoForward() {
  setTime(document.getElementById('thermalVideo').currentTime + 1);
};

function setTime(t) {
  document.getElementById('thermalVideo').currentTime = t;
  document.getElementById('irVideo').currentTime = t;
  document.getElementById('videoSlider').value = t;
  document.getElementById('videoTime').innerHTML = Math.floor(t);
}
