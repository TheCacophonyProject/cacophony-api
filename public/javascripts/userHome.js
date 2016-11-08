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
  // Load user data fields
  // Username`
  if (userData.username)
    document.getElementById('username').innerText = userData.username;
  else
    document.getElementById('username').innerText = 'no data';

  // First name
  if (userData.firstname)
    document.getElementById('first-name').innerText = userData.firstname;
  else
    document.getElementById('first-name').innerText = 'no data';

  // Last name
  if (userData.lastname)
    document.getElementById('last-name').innerText = userData.lastname;
  else
    document.getElementById('last-name').innerText = 'no data';

  // Email
  if (userData.email)
    document.getElementById('email').innerText = userData.email;
  else
    document.getElementById('email').innerText = 'no data';

  if (userData.groups.length === 0) {
    document.getElementById('groups').innerText = 'No grups';
  } else {
    document.getElementById('groups').innerText = getGroupListText(userData);
  }
}

function getGroupListText(userData) {
  var groups = [];
  for (var i in userData.groups) {
    groups.push(userData.groups[i].groupname);
  }
  return groups.join(', ');
}

function userRequestError(res) {
  console.log('Request Error');
  console.log(res);
}

function newGroup() {
  window.location.assign('/new_group');
}
