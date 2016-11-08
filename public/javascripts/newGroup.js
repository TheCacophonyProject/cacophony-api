window.onload = function() {
  $("#new-group").click(newGroup);
};

function newGroup() {
  var jwtToken = sessionStorage.getItem('token');
  if (!jwtToken) {
    window.alert('No user data found, please log in before making a new Group.');
    return;
  }
  var groupname = document.getElementById('group-name').value;

  if (!groupname) {
    window.alert('invalid group name');
    return;
  }

  $.ajax({
    url: '/api/v1/groups',
    type: 'post',
    data: 'groupname=' + groupname,
    headers: { 'Authorization': jwtToken },
    success: newGroupSuccess,
    error: newGroupError
  });
}

function newGroupError(err) {
  console.log(err);
  window.alert(err);
}

function newGroupSuccess(res) {
  var jwtToken = sessionStorage.getItem('token');
  $.ajax({
    url: '/api/v1/users',
    type: 'get',
    headers: { 'Authorization': jwtToken },
    success: function(res) {
      sessionStorage.setItem('userData', JSON.stringify(res.userData));
      window.location.assign('/user_home');
    },
    error: function(err) {
      console.log(err);
      window.alert('Error with loading user data.');
    }
  });
}
