/*
Contains the tagging functions (delete, load, new).
*/

tags = { recordingsIds: {} };

/**
 * Deletes a tag.
 */
tags.delete = function(event) {
  var id = event.target.tagId;
  console.log("Deleting tag:", id);
  console.log(event.target.row);
  $.ajax({
    url: '/api/v1/tags',
    type: 'DELETE',
    headers: { 'Authorization': sessionStorage.getItem('token') },
    data: { "tagId": id },
    success: function() {
      var row = event.target.parentNode.parentNode;
      row.parentNode.removeChild(row);
      console.log("Deleted tag.")
    },
    error: function(err) {
      console.log("Error:", err);
    }
  })
};

/**
 * Adds a tag to the tag table.
 */
tags.addTagToTable = function(tag) {
  var tagsTable = document.getElementById('tags-table');
  // Make new row.
  var row = tagsTable.insertRow(tagsTable.rows.length);
  // Add each element to row.
  var id = document.createElement('th');
  id.innerHTML = tag.id;
  row.appendChild(id);
  var animal = document.createElement('th');
  animal.innerHTML = tag.animal;
  row.appendChild(animal);
  var number = document.createElement('th');
  number.innerHTML = tag.number;
  row.appendChild(number);
  var confidence = document.createElement('th');
  confidence.innerHTML = tag.confidence;
  row.appendChild(confidence);
  var age = document.createElement('th');
  age.innerHTML = tag.age;
  row.appendChild(age);
  var startTime = document.createElement('th');
  startTime.innerHTML = tag.startTime;
  row.appendChild(startTime);
  var duration = document.createElement('th');
  duration.innerHTML = tag.duration;
  row.appendChild(duration);
  var killedTime = document.createElement('th');
  killedTime.innerHTML = tag.killedTime;
  row.appendChild(killedTime);
  var poisionedTime = document.createElement('th');
  poisionedTime.innerHTML = tag.poisionedTime;
  row.appendChild(poisionedTime);
  var trapInteractionTime = document.createElement('th');
  trapInteractionTime.innerHTML = tag.trapInteractionTime;
  row.appendChild(trapInteractionTime);
  var trapInteractionDuration = document.createElement('th');
  trapInteractionDuration.innerHTML = tag.trapInteractionDuration;
  row.appendChild(trapInteractionDuration);
  var trappedTime = document.createElement('th');
  trappedTime.innerHTML = tag.trappedTime;
  row.appendChild(trappedTime);
  var trapType = document.createElement('th');
  trapType.innerHTML = tag.trapType;
  row.appendChild(trapType);

  // Add delete button
  var del = document.createElement('th');
  var deleteButton = document.createElement('button');
  deleteButton.innerHTML = "Delete"
  deleteButton.onclick = tags.delete;
  deleteButton.tagId = tag.id;
  deleteButton.tagRow = row;
  del.appendChild(deleteButton)
  row.appendChild(del);
};
/**
 * Loads all the tags in the list given to the table.
 */
tags.load = function(loadingTags) {
  console.log("Loading tags into table.");
  for (var i in loadingTags) {
    tags.addTagToTable(loadingTags[i]);
  }
};

/**
 * Create a new tag from the fields and sends tag to server.
 */
tags.new = function() {
  if (document.getElementById("tagForm").checkValidity() == false) {
    console.log("Form is invalid");
    return;
  }
  var tag = {};
  try {
    tag.animal = tags.parseSelect('tagAnimalInput');
    tag.number = tags.parseInt('tagNumberInput');
    tag.confidence = tags.parseConfidence('tagConfidenceInput');
    tag.age = tags.parseAge('tagAgeInput');
    tag.startTime = tags.parseTime('tagStartTimeInput');
    tag.duration = tags.parseDuration(
      'tagStartTimeInput', 'tagStopTimeInput');
    tag.killedTime = tags.parseTime('tagKilledTimeInput');
    tag.poisionedTime = tags.parseTime('tagPoisionedTimeInput');
    tag.trapInteractionTime = tags.parseTime('tagTrapInteractionTimeInput');
    tag.trapInteractionDuration = tags.parseDuration(
      'tagTrapInteractionTimeInput', 'tagTrapInteractionStopTimeInput');
    tag.trappedTime = tags.parseTime('tagTrappedTimeInput');
    tag.trapType = tags.parseSelect('tagTrapTypeInput');
  } catch (err) {
    console.log(err);
    return;
  }
  console.log("New tag:", tag);
  var data = tags.recordingsIds;
  data.tag = JSON.stringify(tag);
  console.log(data);
  // Upload new tag
  $.ajax({
    url: '/api/v1/tags',
    type: 'POST',
    headers: { 'Authorization': sessionStorage.getItem('token') },
    data: data,
    success: function(res) {
      console.log("Success");
      tag.id = res.tagId;
      tags.addTagToTable(tag);
    },
    error: function(err) {
      console.log("Error:", err);
    }
  })
};

/**
 * Parses a Select input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseSelect = function(id) {
  return document.getElementById(id).value;
}

/**
 * Parses a Integer input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseInt = function(id) {
  var i = parseInt(document.getElementById(id).value);
  if (isNaN(i)) i = null;
  return i;
}

/**
 * Parses a Age input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseAge = function(id) {
  var ageString = document.getElementById(id).value;
  var ageYears = parseInt(ageString.split(':')[0]);
  var ageMonths = parseInt(ageString.split(':')[1]);
  var age = ageYears * 12 + ageMonths;
  if (isNaN(age)) age = null;
  return age
}

/**
 * Parses a Time input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseTime = function(id) {
  var timeString = document.getElementById(id).value;
  var timeMin = parseInt(timeString.split(':')[0]);
  var timeSec = parseInt(timeString.split(':')[1]);
  var time = timeMin * 60 + timeSec;
  if (isNaN(time)) time = null;
  return time;
}

/**
 * Parses a Duration input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 * The duration is calculated as the secconds from the start time to end time.
 */
tags.parseDuration = function(startId, endId) {
  var endTime = tags.parseTime(endId)
  var startTime = tags.parseTime(startId)
  var duration = tags.parseTime(endId) - tags.parseTime(startId);
  if (endTime == null || startTime == null) return null
  if (duration <= 0) throw { message: "duration can't be negative" };
  return duration;
}

/**
 * Parses a String input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseString = function(id) {
  var val = document.getElementById(id).value;
  if (val === "") val = null;
  return val;
}

/**
 * Parses a Confidence input, if input is invalid it will throw an error.
 * A null/empty result is not considered invalid.
 */
tags.parseConfidence = function(id) {
  var val = $('input[name="' + id + '"]:checked').val();
  return val;
}
