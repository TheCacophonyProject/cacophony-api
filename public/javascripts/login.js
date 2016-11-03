window.onload = function() {
  $("#login").click(login);
};

function login() {
  $.ajax({
    url: '/authenticate_user',
    type: 'post',
    data: "password="+password.value+"&username="+username.value,
    success: loginSuccess,
    error: loginError
  });
}

function loginSuccess(res) {
  console.log("login");
  sessionStorage.setItem('token', res.token);
  sessionStorage.setItem('userData', JSON.stringify(res.userData));
  window.location.assign("/user_home");
}

function loginError(res) {
  console.log("Error");
}
