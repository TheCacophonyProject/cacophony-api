var viewVideo = {};

viewVideo.test = function() {
  console.log('test');
};

viewVideo.getVideo = function() {
  console.log(id);
  var headers = { where: '{"id": ' + id + '}' };
  var jwt = sessionStorage.getItem('token');
  if (jwt) headers.Authorization = jwt;
  $.ajax({
    url: apiUrl,
    type: 'get',
    headers: headers,
    success: viewVideo.getVideo1Success,
    error: viewVideo.requestError
  });
};

viewVideo.getVideo1Success = function(result) {
  video1 = result.result.rows[0];
  if (!video1.videoPair) {
    viewVideo.loadSingleVideo(video1);
  }
  var headers = {};
  var jwt = sessionStorage.getItem('token');
  if (jwt) headers.Authorization = jwt;
  $.ajax({
    url: apiUrl + '/' + id + '/videopair',
    type: 'get',
    headers: headers,
    success: (res) => viewVideo.getVideo2Success(video1, res),
    error: viewVideo.requestError
  });


  //console.log(result.result.rows[0]);
};

viewVideo.getVideo2Success = function(video1, result) {
  console.log(result);
  video2 = result.datapoint;
  viewVideo.loadVideoPair(video1, video2);
};



viewVideo.loadSingelVideo = function(video) {
  console.log('Loading single video.');
};

viewVideo.loadVideoPair = function(video1, video2) {
  console.log('Loading video pair');

  var url1 = apiUrl + '/' + video1.id;
  var url2 = pairApiUrl + '/' + video2.id;

  var signedUrl = '/api/v1/signedUrl?jwt=';

  viewVideo.getPlayerSource(url1, (err, res) => {
    var videoEle = document.getElementById('primaryVideo');
    videoEle.addEventListener('loadedmetadata', function(res) {
      document.getElementById('videoSlider').max = videoEle.duration;
      document.getElementById('videoSlider').oninput = viewVideo.sliderInput;
    });
    var source = document.createElement('source');
    source.setAttribute('src', signedUrl + res.jwt);
    videoEle.appendChild(source);
    videoEle.ontimeupdate = viewVideo.ontimeupdate;
    console.log(videoEle);
    document.getElementById('doubleVideoDiv').hidden = false;
  });
  viewVideo.getPlayerSource(url2, (err, res) => {
    var videoEle = document.getElementById('secondaryVideo');
    var source = document.createElement('source');
    source.setAttribute('src', signedUrl + res.jwt);
    videoEle.appendChild(source);
    document.getElementById('doubleVideoDiv').hidden = false;
  });

};

viewVideo.sliderInput = function(ele) {
  var time = Number(ele.target.value);
  time = ""+time;
  document.getElementById('primaryVideo').currentTime = time;
  document.getElementById('secondaryVideo').currentTime = time;
};


viewVideo.ontimeupdate = function() {
  if (document.getElementById('primaryVideo').paused) return;
  var t = document.getElementById('primaryVideo').currentTime;
  document.getElementById('videoSlider').value = t;
  document.getElementById('videoTime').innerHTML = Math.floor(t);
};

viewVideo.getPlayerSource = function(url, callback) {
  var headers = {};
  var jwt = sessionStorage.getItem('token');
  if (jwt) headers.Authorization = jwt;
  $.ajax({
    url: url,
    type: 'get',
    headers: headers,
    success: (res) => callback(null, res),
    error: callback,
  });
};

viewVideo.playPause = function(ele) {
  console.log('Play/Pause');
  var video1 = document.getElementById('primaryVideo');
  var video2 = document.getElementById('secondaryVideo');
  if (video1.paused === true) {
    console.log('playing');
    video1.play();
    video2.play();
    ele.innerHTML = 'Pause';
  } else {
    console.log('pausing');
    video1.pause();
    video2.pause();
    ele.innerHTML = 'Play';
  }
};



viewVideo.videoBack = function() {
  viewVideo.setTime(document.getElementById('primaryVideo').currentTime - 1);
};

viewVideo.videoForward = function() {
  viewVideo.setTime(document.getElementById('primaryVideo').currentTime + 1);
};

viewVideo.setTime = function(t) {
  document.getElementById('primaryVideo').currentTime = t;
  document.getElementById('secondaryVideo').currentTime = t;
  document.getElementById('videoSlider').value = t;
  document.getElementById('videoTime').innerHTML = Math.floor(t);
}

viewVideo.getVideo();
