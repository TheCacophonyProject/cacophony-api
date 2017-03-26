window.onload = function() {
  var headers = { where: '{"id": ' + id + '}' };
  var jwt = sessionStorage.getItem('token');
  if (jwt) {
    headers.Authorization = jwt;
  }
  $.ajax({
    url: apiUrl,
    type: 'get',
    headers: headers,
    success: requestSuccess,
    error: requestError
  });
  getPlayerSource(document.getElementById('player')); // Gets a tempory URL (10 minutes) that can be used as the audio source
  $("#delete-button").click(deleteDatapoint);
  $("#add-tag-button").click(addTag);
  newTag.setup();
};

var recording = null;

function requestError(err) {
  console.log(err);
  window.alert(err);
}

function requestSuccess(res) {
  console.log(res);
  recording = res.result.rows[0];

  document.getElementById('time-text').innerHTML = getStartTimeText();
  document.getElementById('date-text').innerHTML = getRecordingDateText();
  document.getElementById('location-text').innerHTML = getLocationText();
  document.getElementById('relative-to-dawn-text').innerHTML =
    getRelativeToDawnText();
  document.getElementById('relative-to-dusk-text').innerHTML =
    getRelativeToDuskText();
  document.getElementById('isVideoPairText').innerHTML = getIsVideoPairTest();

  loadTags(recording.tags);
}

function getIsVideoPairTest() {
  return recording.videoPair;
}

function getRelativeToDawnText() {
  return recording.relativeToDawn;
}

function getRelativeToDuskText() {
  return recording.relativeToDusk;
}

function getRecordingDateText() {
  return recording.recordingDateTime;
}

function getStartTimeText() {
  return recording.recordingTime;
}

function getLocationText() {
  return recording.location;
}

function deleteTagFunc(event) {
  var button = event.target;
  var tagId = button.tagId;
  var row = button.parentNode.parentNode;
  console.log('Delete: ', tagId);
  $.ajax({
    url: apiUrl + '/' + id + '/tags',
    type: 'DELETE',
    headers: { Authorization: sessionStorage.getItem('token') },
    data: 'tagsIds=[' + tagId + ']',
    success: function() {
      row.parentNode.removeChild(row);
    },
    error: function() {},
  });
}

function addTag(tagJson) {
  // Send tag to be saved.
  $.ajax({
    url: apiUrl + '/' + id + '/tags',
    type: 'POST',
    headers: { Authorization: sessionStorage.getItem('token') },
    data: 'tags=[' + JSON.stringify(tagJson) + ']',
    success: reloadTags,
    error: function(err) {
      console.log(err);
    }
  });
}

function reloadTags() {
  $.ajax({
    url: apiUrl + '/' + id + '/tags',
    type: 'GET',
    headers: { Authorization: sessionStorage.getItem('token') },
    success: function(result) {
      loadTags(result.tags);
    },
    error: function(err) {
      console.log(err);
    }
  });
}

function loadTags(tags) {
  console.log(tags);
  // Clear table
  var table = document.getElementById('tags-table');
  var rowCount = table.rows.length;
  while (--rowCount) table.deleteRow(rowCount);

  delete tags.length;
  delete tags.nextId;
  for (var id in tags)
    addTagToTable(id, tags[id]);
}

function addTagToTable(id, tag) {
  var table = document.getElementById('tags-table');
  var newRow = table.insertRow(table.rows.length);
  console.log("Adding Tag: ", tag);
  // Adding tag value to row.
  var valueTd = document.createElement("td");
  valueTd.innerHTML = JSON.stringify(tag);
  newRow.appendChild(valueTd);
  // Adding Delete button to row.
  var buttonTd = document.createElement("td");
  var deleteButton = document.createElement("button");
  deleteButton.innerHTML = "Delete";
  deleteButton.tagId = id;
  deleteButton.onclick = deleteTagFunc;
  buttonTd.appendChild(deleteButton);
  newRow.appendChild(buttonTd);
}

appendModelToTable = function(model) {
  var newRow = util.getNewEmptyRow();
  var tableData = getTableData();
  newRow.appendChild(modelViewElement(model));
  for (var i in tableData) {
    var value = model[tableData[i].modelField];
    newRow.appendChild(tableData[i].parseFunction(value));
  }
  newRow.appendChild(modelDeleteDatapoint(model, newRow));
};

function getTagsText() {
  if (recording.tags) {
    return JSON.stringify(recording.tags);
  } else {
    return "No tags for recording.";
  }
}

function getPlayerSource(player) {
  var source = document.createElement('source');

  var headers = {};
  var jwt = sessionStorage.getItem('token');
  if (jwt) {
    headers.Authorization = jwt;
  }
  $.ajax({
    url: apiUrl + "/" + id,
    type: 'get',
    headers: headers,
    success: function(response) {
      var src = "/api/v1/signedUrl?jwt=" + response.jwt;
      source.src = src;
      player.appendChild(source);
    },
    error: function(err) {
      console.log("Error with getting temp file url.", err);
    }
  });
}

function deleteDatapoint() {
  var headers = { Authorization: sessionStorage.getItem('token') };
  $.ajax({
    url: apiUrl + '/' + id,
    type: 'DELETE',
    headers: headers,
    success: function() {
      console.log("Datapoiint deleted.");
      window.alert("Datapoint deleted.");
    },
    error: function(err) {
      console.log(err);
      window.alert("Failed to delete datapoint.");
    }
  });
}
