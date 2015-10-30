function toggleShow(element) {
  if (element.className.indexOf('hidden') > -1) {
    element.className = element.className.replace('hidden', 'show');
  }
  else if (element.className.indexOf('show') > -1) {
    element.className = element.className.replace("show", "hidden");
  }
  else {
    element.className = element.className + ' hidden';
  }
}


function addField(model) {
  //var div = document.getElementById(model+'ExtraDiv');
  div = document.getElementById(model+'Div');
  var fieldName = document.getElementById(model+'Extra').value.replace(/\s/g, '_');

  //Div for the form group
  var newFormGroupDiv = document.createElement('div');
  newFormGroupDiv.setAttribute('class', 'form-group');

  //Label for the field
  var newLabel = document.createElement('label');
  newLabel.setAttribute('for', newFieldId);
  newLabel.setAttribute('class', 'col-sm-2 control-label');
  newLabel.innerHTML = fieldName;

  //Div for the input field
  var newSm8Div = document.createElement('div');
  newSm8Div.setAttribute('class', 'col-sm-8');

  //Input for inputting the field value
  var newField = document.createElement('input');
  var newFieldId = model+'-'+fieldName
  newField.setAttribute('id', newFieldId);
  newField.setAttribute('class', 'form-control metadata');

  div.appendChild(newFormGroupDiv);
  newFormGroupDiv.appendChild(newLabel);
  newFormGroupDiv.appendChild(newSm8Div);
  newSm8Div.appendChild(newField);
}

function fileSelected() {
  var file = document.getElementById('fileToUpload').files[0];
  if (file) {
    var fileSize = 0;
    if (file.size > 1024 * 1024)
      fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
      fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';

    document.getElementById('fileName').innerHTML = 'Name: ' + file.name;
    document.getElementById('fileSize').innerHTML = 'Size: ' + fileSize;
    document.getElementById('fileType').innerHTML = 'Type: ' + file.type;
  }
}

function uploadFile() {
  var fd = new FormData();
  fd.append("recording", document.getElementById('fileToUpload').files[0]);

  var metaJson = {
    dataPoint: {},
    location: {},
    recording: {},
    device: {},
    hardware: {},
    software: {},
    microphone: {},
    environment: {},
    recording_rule: {}
  };

  var elements = document.getElementsByClassName('metadata');
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    if (element.value == 'checkbox' && element.checked) {
      addElementToJson(metaJson, element);
    } else if (element.type == 'text' && element.value != '') {
      addElementToJson(metaJson, element);
    }
  }


  fd.append("json", JSON.stringify(metaJson));
  var xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("progress", uploadProgress, false);
  xhr.addEventListener("load", uploadComplete, false);
  xhr.addEventListener("error", uploadFailed, false);
  xhr.addEventListener("abort", uploadCanceled, false);
  xhr.open("POST", "/upload");
  console.log(metaJson);
  xhr.send(fd);
}

function addElementToJson(json, element) {
  var table = element.id.substring(0, element.id.indexOf('-'));
  var field = element.id.substring(element.id.indexOf('-')+1);
  if (!json[table]) { json[table] = {}; }
  json[table][field] = element.value;
}

function uploadProgress(evt) {
  if (evt.lengthComputable) {
    var percentComplete = Math.round(evt.loaded * 100 / evt.total);
    document.getElementById('progressNumber').innerHTML = percentComplete.toString() + '%';
  }
  else {
    document.getElementById('progressNumber').innerHTML = 'unable to compute';
  }
}

function uploadComplete(evt) {
  /* This event is raised when the server send back a response */
  alert(evt.target.responseText);
}

function uploadFailed(evt) {
  alert("There was an error attempting to upload the file.");
}

function uploadCanceled(evt) {
  alert("The upload has been canceled by the user or the browser dropped the connection.");
}
