navbar = {};

navbar.setup = function() {
  // setup functions for navbar
  console.log(sessionStorage.getItem('userData'));
  var userData = JSON.parse(sessionStorage.getItem('userData'));
  if (userData) {
    var navbarUserDetails = document.getElementById("navbar-user-details");
    $("#navbar-user-details").show();
    document.getElementById('navbar-logout').onclick = navbar.logout;
    document.getElementById('navbar-hello-user').innerText = 'Hello ' + userData.username;
  } else {
    $("#navbar-login").show();

  }
};

navbar.logout = function() {
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('token');
  window.location.reload(false);
};

navbar.setup();
