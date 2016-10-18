window.onload = function() {
  $.ajax({
    url: '/api/v1/user',
    type: 'get',
    beforeSend: function(request) {
      request.setRequestHeader('Authorization', sessionStorage.getItem('token'));
    },
    success: userRequestSuccess,
    error: userRequestError
  })
}

function userRequestSuccess(res) {
  $('#username')[0].innerText = res.userData.username;
  $('#first-name')[0].innerText = res.userData.firstName;
  $('#last-name')[0].innerText = res.userData.lastName;
  $('#email')[0].innerText = res.userData.email;
  console.log(res);
}

function userRequestError(res) {
  console.log('Request Error');
  console.log(res);
}
