window.onload = function() {
  $("#register").click(register)
}

function register() {
  var password = document.getElementById("password");
  var passwordRetype = document.getElementById("passwordRetype");
  var username = document.getElementById("username");

  // Check that username and password are valid.
  if (password.value != passwordRetype.value) {
    password.value = "";
    passwordRetype.value = "";
    window.alert("Passwords don't match.");
    return;
  }
  if (password.value.length < 5) {
    password.value = "";
    passwordRetype.value = "";
    window.alert("Password not long enough.");
    return;
  }

  if (username.value.length < 5) {
    password.value = "";
    passwordRetype.value = "";
    window.alert("Username not long enough.");
    return;
  }

  $.ajax({
    url: '/api/v1/User',
    type: 'post',
    data: "password="+password.value+"&username="+username.value,
    success: registerSuccess,
    error: registerError
  });
}

function registerSuccess(res) {
  console.log(res);
  sessionStorage.setItem('token', res.token);
  window.location.assign("/user_home");
}

function registerError(res) {
  console.log(res);
  console.log("Error");
}
