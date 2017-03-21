window.onload = function() {
  $("#login").click(login);
};

function login() {
  var password = document.getElementById('inputPassword').value;
  var username = document.getElementById('inputUsername').value;

  $.ajax({
    url: '/authenticate_user',
    type: 'post',
    data: "password="+password+"&username="+username,
    success: loginSuccess,
    error: loginError
  });
}

function loginSuccess(res) {
  sessionStorage.setItem('token', res.token);
  sessionStorage.setItem('userData', JSON.stringify(res.userData));
  window.location.assign("/user_home");
}

function loginError(res) {
  document.getElementById('inputUsername').value = '';
  document.getElementById('inputPassword').value = '';
  var messages = JSON.parse(res.responseText).messages.join('.');
  console.log(messages);
  window.alert(messages);
  document.getElementById('messages').innerHTML = messages;
}
