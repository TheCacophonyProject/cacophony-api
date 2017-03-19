// This JSON describes what type of tags to have.

// {
//   dataType1: [{tagField1forDT1}, {tagField2forDT1}, {tagField3forDT1}],
// },
// {
//   dataType2: [{tagField1forDT2}, {tagField2forDT2}, {tagField3forDT2}],
// },
//
// dataype: video, audio...

// tagField format..
// {
//   name: 'fieldName',      // HTML Label for this field.
//   id: 'fieldIdInDatabase', // Id that will be use to send the data back,
//   type: 'Type of data',    // HTML select, time, number, selectWithOther, Confidence
//   other values needed depending on the type as set above.
// }

var tagsLayout = {
  video: [ // List of tag types for videos.
    {
      name: 'Pest',
      id: 'pestTag',
      fields: [ // Fields for Pest
        {
          name: 'Animal',
          id: 'animal',
          type: 'selectWithOther',
          values: ['Cat', 'Deer', 'Dog', 'Goat', 'Hedgehog', 'Mouse',
            'Stoat', 'Weasel', 'Ferret', 'Pig', 'Possum', 'Rabbit/Hare',
            'Rat', 'Other'
          ],
          required: true,
          description: 'What type of pest do you see? If there is more than' +
            ' one type of animal on at a time, add a tag for each type.'
        },
        {
          name: 'Time range',
          id: 'timeRange',
          type: 'timeRange',
          required: true,
          description: 'When the tag starts and ends.',
        },
        {
          name: 'Number',
          id: 'amount',
          type: 'number',
          required: true,
          description: 'Number of animals of the species selected.',
        },
        {
          name: 'Confidence:',
          id: 'confidence',
          type: 'confidence',
          required: true,
          description: 'How confident are you in the idenfication.'
        },
      ],
    },
    {
      name: 'Bird',
      id: 'birdTag',
      fields: [{
          name: 'Specie',
          id: 'birdSpecie',
          type: 'selectWithOther',
          values: ['Kea', 'Fantail'],
          required: true,
          description: 'What species of bird do you see?',
        },
        {
          name: 'Start',
          id: 'startTime',
          type: 'time',
          required: true,
          description: 'Start time of tag.',
        },
        {
          name: 'End',
          id: 'end',
          type: 'time',
          required: true,
          description: 'End time of tag.',
        },
        {
          name: 'Amount of birds',
          id: 'amountOfAnimals',
          type: 'number',
          required: true,
          description: 'Number of birds of the species selected.'
        },
        {
          name: 'Confidence:',
          id: 'confidence',
          type: 'confidence',
          required: true,
          description: 'How confident are you in the idenfication.'
        },
      ],
    },
  ],
};

var newTag = {};

newTag.hideAllBut = function(type) {
  for (var i in newTag.tagTypeList) {
    var name = newTag.tagTypeList[i];
    var form = document.getElementById(name);
    if (name == type)
      form.hidden = false;
    else
      form.hidden = true;
  }
};

newTag.setup = function() {
  var selectEvent = document.getElementById('event-type');
  var tagsDev = document.getElementById('tags-dev');
  var tagTypes = tagsLayout.video;
  var first = true;
  for (var i in tagTypes) { // For each tag type
    var tagType = tagTypes[i];
    console.log('Adding new tag type: ', tagType.name);
    newTag.tagTypeList.push(tagType.id);
    var tagForm = document.createElement('div');
    tagForm.class = 'form-horizontal';
    tagForm.id = tagType.id;
    // Hide all but the first.
    tagForm.hidden = !first;
    first = false;

    // For each field add append a 'form-row' onto the form for that field.
    // The 'form-row' is generated depending on the 'field.type'.
    for (var j in tagType.fields) {
      var field = tagType.fields[j];
      tagForm.appendChild(newTag.field[field.type](field));
    }

    tagsDev.appendChild(tagForm);
    // Add option to selectEvent.
    var option = document.createElement('option');
    option.innerHTML = tagType.name;
    option.tagId = tagType.id;
    selectEvent.appendChild(option);
  }

  selectEvent.onchange = function(event) {
    newTag.hideAllBut(event.target.options[event.target.selectedIndex].tagId);
  };
};

newTag.tagTypeList = [];

newTag.field = {};

newTag.getNewFieldFormRow = function(field) {
  var formRow = document.createElement('div');
  formRow.class = 'form-group row';
  formRow.type = field.type;
  formRow.id = field.id;
  formRow.required = field.required;
  formRow.disName = field.name;
  var label = document.createElement('label');
  label.innerHTML = field.name;
  formRow.appendChild(label);
  return formRow;
};

// HTML select with 'other' as a optin, when other is selected a text field
// shows where the user can input their value there.
newTag.field.selectWithOther = function(field) {
  var formRow = newTag.getNewFieldFormRow(field); // Makes form row with label.
  var select = document.createElement('select');
  var option = document.createElement('option');
  select.appendChild(option);
  for (var i in field.values) {
    option = document.createElement('option');
    option.innerHTML = field.values[i];
    select.appendChild(option);
  }
  formRow.appendChild(select);
  var otherText = document.createElement('input');
  otherText.setAttribute('type', 'text');
  otherText.hidden = true;
  formRow.appendChild(otherText);
  select.onchange = function() {
    otherText.hidden = select.options[select.selectedIndex].value !==
      'Other';
  };
  return formRow;
};

newTag.field.select = function(field) {
  var formRow = newTag.getNewFieldFormRow(field); // Makes form row with label.
  var select = document.createElement('select');
  var option = document.createElement('option');
  select.appendChild(option);
  for (var i in field.values) {
    option = document.createElement('option');
    option.innerHTML = field.values[i];
    select.appendChild(option);
  }
  formRow.appendChild(select);
  var otherText = document.createElement('input');
  otherText.setAttribute('type', 'text');
  otherText.hidden = true;
  formRow.appendChild(otherText);
  return formRow;
};

newTag.field.time = function(field) {
  var formRow = newTag.getNewFieldFormRow(field);
  var time = document.createElement('input');
  time.setAttribute('type', 'time');
  formRow.appendChild(time);
  return formRow;
};

newTag.field.number = function(field) {
  var formRow = newTag.getNewFieldFormRow(field);
  var number = document.createElement('input');
  number.setAttribute('type', 'number');
  formRow.appendChild(number);
  return formRow;
};

newTag.field.timeRange = function(field) {
  var formRow = newTag.getNewFieldFormRow(field);
  var time1 = document.createElement('input');
  time1.setAttribute('type', 'time');
  var time2 = document.createElement('input');
  time2.setAttribute('type', 'time');
  var label1 = document.createElement('Label');
  label1.innerHTML = 'Start:';
  var label2 = document.createElement('label');
  label2.innerHTML = 'End:';
  formRow.appendChild(label1);
  formRow.appendChild(time1);
  formRow.appendChild(label2);
  formRow.appendChild(time2);
  return formRow;
};

newTag.field.confidence = function(field) {
  var formRow = newTag.getNewFieldFormRow(field);
  // Radio buttons
  var sure = document.createElement('input');
  sure.setAttribute('type', 'radio');
  sure.name = 'confidence';
  var notSure = document.createElement('input');
  notSure.setAttribute('type', 'radio');
  notSure.name = 'confidence';
  var noIdea = document.createElement('input');
  noIdea.setAttribute('type', 'radio');
  noIdea.name = 'confidence';
  // Labels
  var sureL = document.createElement('label');
  sureL.innerHTML = ' Sure:';
  var notSureL = document.createElement('label');
  notSureL.innerHTML = ' Not Sure:';
  var noIdeaL = document.createElement('label');
  noIdeaL.innerHTML = ' No idea:';
  // Append to formRow.
  formRow.appendChild(sureL);
  formRow.appendChild(sure);
  formRow.appendChild(notSureL);
  formRow.appendChild(notSure);
  formRow.appendChild(noIdeaL);
  formRow.appendChild(noIdea);
  return formRow;
};

newTag.addTag = function() {
  var validTag = true;
  var errorMessages = [];
  var result = {};
  var select = document.getElementById('event-type');
  var id = select.options[select.selectedIndex].tagId;
  var form = document.getElementById(id);
  for (var i = 0; i < form.children.length; i++) {
    var childDiv = form.children[i];
    if (childDiv.type) {
      var childResult = newTag.getField[childDiv.type](childDiv);
      for (var key in childResult) {
        if (key == '__error') {
          validTag = false;
          errorMessages.push(childResult[key]);
        }
        if (childDiv.required && childResult[key] === null) {
          validTag = false;
          errorMessages.push("Field '"+childDiv.disName+"' is required.");
        }
        result[key] = childResult[key];
      }
    }
  }
  console.log('Result:', result);
  removeErrorMessages();
  if (validTag)
    addTag(result);
  else
    displayErrorMessages(errorMessages);
};

function removeErrorMessages() {
  var errorBox = document.getElementById('error-box');
  errorBox.innerHTML = '';
}

function displayErrorMessages(errorMessages) {
  var errorBox = document.getElementById('error-box');
  var message = '';
  for (var i in errorMessages) {
    message = message + errorMessages[i]+'<br>';
  }
  errorBox.innerHTML = message;
}

newTag.getField = {};

// Get functions for the fields.
newTag.getField.selectWithOther = function(element) {
  var result = {};
  var id = element.id;
  var select = element.children[1];
  var selectValue = select.options[select.selectedIndex].value;
  if (selectValue === 'Other')
    result[id] = element.children[2].value;
  else
    result[id] = selectValue;
  if (selectValue === '')
    result[id] = null;
  return result;
};

newTag.getField.select = function(element) {
  var result = {};
  var id = element.id;
  var select = element.children[1];
  var selectValue = select.options[select.selectedIndex].value;
  result[id] = selectValue;
  if (selectValue === '')
    result[id] = null;
  return result;
};

newTag.getField.time = function(element) {
  var result = {};
  var id = element.id;
  var timeInput = element.children[1];
  var time = timeInput.value;
  result[id] = timeToSeconds(time);
  if (isNaN(result[id]))
    result[id] = null;
  return result;
};

newTag.getField.number = function(element) {
  var result = {};
  var id = element.id;
  var numberInput = element.children[1];
  var n = numberInput.value;
  result[id] = n;
  if (n === '')
    result[id] = null;
  return result;
};

newTag.getField.timeRange = function(element) {
  var result = {};
  var start = element.children[2].value;
  var end = element.children[4].value;
  result.start = start;
  result.end = end;
  if (start > end)
    result.__error = "Can't have end time before start time";
  if (start === '' || end === '')
    result.__error = "Invalid time range";
  return result;
};

newTag.getField.confidence = function(element) {
  var result = {};
  var id = element.id;
  if (element.children[2].checked)
    result[id] = 'sure';
  if (element.children[4].checked)
    result[id] = 'notSure';
  if (element.children[6].checked)
    result[id] = 'noIdea';
  if (typeof result[id] !== 'string')
    result[id] = null;
  return result;
};

function timeToSeconds(time) {
  var [minute, seconds] = time.split(':');
  return Number(minute) * 60 + Number(seconds);
}
