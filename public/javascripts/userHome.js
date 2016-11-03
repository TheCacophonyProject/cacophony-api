window.onload = function() {
  var userData = JSON.parse(sessionStorage.getItem('userData'));
  console.log(userData);
  var token = sessionStorage.getItem('token');
  if (!userData || !token) {
    // TODO redirect to login page.
  } else {
    loadUserData(userData);
  }
};

function loadUserData(userData) {
  document.getElementById('username').innerText = userData.username;
  $('#username')[0].innerText = userData.username;
  $('#first-name')[0].innerText = userData.firstName;
  $('#last-name')[0].innerText = userData.lastName;
  $('#email')[0].innerText = userData.email;
  console.log(userData);
}

function userRequestError(res) {
  console.log('Request Error');
  console.log(res);
}
