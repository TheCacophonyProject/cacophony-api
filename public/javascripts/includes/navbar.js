navbar = {};

navbar.setup = function() {
  // setup functions for navbar
  console.log(sessionStorage.getItem('userData'));
  var userData = JSON.parse(sessionStorage.getItem('userData'));
  if (userData) {
    var navbarUserDetails = document.getElementById("navbar-user-details");
    $("#navbar-user-details").show();
    document.getElementById('navbar-logout').onclick = navbar.logout;
    document.getElementById('navbar-hello-user').innerText = 'Hello ' +
      userData.username;
  } else {
    $("#navbar-login").show();

  }
  navbar.activePage();
};

navbar.activePage = function() {
  var path = window.location.pathname;
  if (path === '/get_audio_recordings')
    document.getElementById('navbar-audio').setAttribute('class', 'active');
  else if (path === '/get_ir_video_recordings')
    document.getElementById('navbar-ir-video').setAttribute('class', 'active');
  else if (path === '/get_thermal_video_recordings')
    document.getElementById('navbar-thermal-video').setAttribute('class',
      'active');
  else if (path === '/user_home')
    document.getElementById('navbar-home').setAttribute('class', 'active');
};

navbar.logout = function() {
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('token');
  window.location.reload(false);
};

navbar.setup();
