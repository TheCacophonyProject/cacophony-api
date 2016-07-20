var newRow;           // The newest row in the results table.
var fields = {};      // This holds relevent data for fields.
var childModels = []  // List of the child models.

/**
 * Does an API get request for a recording using the value in the userQuery element.
 */
function query() {
  console.log("Quering with:");
  var q = document.getElementById('query-input').value;
  $.ajax({
    url: apiUrl+'\?q\='+encodeURI(q),
    type: 'GET',
    success: queryDone,
    error: queryError
  });
}

/**
 * Simple functin that is called when the query fails, pops up an allert box.
 */
function queryError(err) {
  window.alert(JSON.stringify(err));
  console.log("Error with query");
  document.getElementById('result').value = "err";
}

/**
 * When a query is complete the each model is added to the results table.
 */
function queryDone(models) {
  models = JSON.parse(models);
  clearTable();
  console.log("Models", models);
  for (var model in models) {
    addEmptyRow();
    appendModelToTable(models[model])
  }
  hideColums();
  console.log(fields);
}

function hideColums() {
  for (field in fields) {
    if (fields[field].show) {
      $('td:nth-child('+(fields[field].index+1)+')').show();
      console.log(fields[field].index)
    } else {
      $('td:nth-child('+(fields[field].index+1)+')').hide();
    }
  }
}

/**
 * appendModelToTable will parse through the fields in the model.
 * If the field is a child model, appendChildModelToTable is called to deal with it.
 * If it not a child model then the field is added using the function appendToTable.
 */
function appendModelToTable(model) {
  for (var field in model) {
    if (childModels.indexOf(field) != -1) {
      appendChildModelToTable(model[field], field);
    } else {
      appendToTable(field, model[field]);
    }
  }
}

/**
 * appendChildModelToTable deals with the child models withen a model.
 * If the field is a child model it calls itself recursively to deal with that child model.
 * If not the field is parsed using appendToTable.
 */
function appendChildModelToTable(model, modelName) {
  for (field in model) {
    if (childModels.indexOf(field) != -1) {
      appendChildModelToTable(model[field], modelName+"/"+field);
    } else {
      appendToTable(field, model[field], modelName);
    }
  }
}

/**
 * appendToTable adds a field to the results table.
 * The fieldTitle will depend on the modelName and field.
 * The fieldTitle is then used to search through the fields variable that
 * holds reevent data, such as row index and the parseFunction.
 * The row index and parseFunction are then used to add the result into the cell.
 */
function appendToTable(field, fieldData, modelName) {
  var fieldTitle;
  if (modelName)
    fieldTitle = modelName+"/"+field;
  else
    fieldTitle = field;

  if (!fields[fieldTitle]) return;
  var index = fields[fieldTitle].index;
  var cell = newRow.cells[index];
  var parseFunction = fields[fieldTitle].parseFunction;
  if (parseFunction) {
    cell.appendChild(parseFunction(fieldData))
  } else {
    cell.innerHTML = fieldData;
  }
  showHideColumn(index, fields[fieldTitle].show);
}

/**
 * Toggle the column view for the given element.
 */
function toggleColumn(ele) {
  ele = ele.target;
  if (!fields[ele.fieldTitle]) {
    console.log("Could not find field data.");
    return;
  }
  var show = !fields[ele.fieldTitle].show;
  var index = fields[ele.fieldTitle].index;
  console.log("Show:", show);
  console.log("Index:", index);
  showHideColumn(index, show);
  fields[ele.fieldTitle].show = show;
  if (show)
    ele.innerHTML = "&#10004"+ele.innerHTML;
  else
    ele.innerHTML = ele.innerHTML.substr(1);
}

function showHideColumn(nthChild, show) {
  nthChild++;
  if (show){
    $('td:nth-child('+nthChild+')').show();
  } else {
    $('td:nth-child('+nthChild+')').hide();
  }
}

/**
 * Generates the colums for the results-table.
 * Makes a column from each field in the modelLayout variable.
 */
function generateTableColumns(modelLayout) {
  document.getElementById('results-table').insertRow(0);
  var keySelect = document.getElementById("key-select");
  for (var field in modelLayout) {
    if (modelLayout[field]._childModel) {
      console.log(field+" is a child model!");
      childModels.push(field);
      keySelect.appendChild(generateChildTableField(modelLayout[field], field));
    } else if (field != '_childModel') {
      keySelect.appendChild(generateTableField(field, modelLayout[field]));
    }
  }
}

/**
 * Parses through a child model in modelLayout to add to the results-table.
 */
function generateChildTableField(model, modelName) {
  var li = document.createElement("li");
  var a = document.createElement("a");
  var ul = document.createElement("ul");
  for (var field in model) {
    if (model[field]._childModel) {
      console.log(field+" is a child model!");
      childModels.push(modelName+"/"+field);
      ul.appendChild(generateChildTableField(model[field], modelName+"/"+field));
    } else if (field != '_childModel') {
      ul.appendChild(generateTableField(field, model[field], modelName));
    }
  }
  li.className = "dropdown-submenu";
  a.innerHTML = modelName;
  a.href = "#";
  ul.className = "dropdown-menu";
  li.appendChild(a);
  li.appendChild(ul);
  return li;
}

/**
 * Adds a field to results-table
 */
function generateTableField(field, fieldData, modelName) {
  var fieldTitle;

  //Generating field title
  if (modelName)
    fieldTitle = modelName+"/"+field;
  else
    fieldTitle = field;
  while (fields[fieldTitle]) {
    fieldTitle = fieldTitle+"_";
  }

  //Generate
  var index = appendColumn(fieldTitle);
  fields[fieldTitle] = {
    index: index,
    parseFunction: fieldData.parseFunction,
    show: fieldData.show
  }
  showHideColumn(index, fieldData.show);
  // ✔
  // onclick = toggleColumn;
  //Generate and return dropdown-menu TODO
  var li = document.createElement("li");
  var a = document.createElement("a");
  a.href = "#";
  a.fieldTitle = fieldTitle;
  a.onclick = toggleColumn;
  if (fields[fieldTitle].show)
    a.innerHTML = "✔"+field;
  else
    a.innerHTML = field;

  li.appendChild(a);
  return li
}

/**
 * Adds a column to the resuts table with the given name.
 * Returns the column index.
 */
function appendColumn(name) {
  //console.log("Appending column:", name);
  var table = document.getElementById('results-table');
  var row = table.rows[0];
  var index = row.cells.length;
  var columnLable = row.insertCell(index);
  columnLable.innerHTML = name;
  return index;
}

/**
 * Adds an empty row to results-table.
 * Returns the row number.
 */
function addEmptyRow() {
  var table = document.getElementById('results-table');
  newRow = table.insertRow(table.rows.length);
  for (var i = 0; i < table.rows[0].cells.length; i++) {
    var cell = newRow.insertCell(i);
  }
}



/**
 * This clears the result table apart from the first row.
 */
function clearTable() {
  var table = document.getElementById('results-table');
  var rowCount = table.rows.length;
  while(--rowCount) table.deleteRow(rowCount);
}


window.onload = function() {
  generateTableColumns(modelLayout);
  console.log(fields);
  console.log(childModels);
  // set onclick functions
  $("#start-time-check").click(function(){
      $("#start-time-start").attr('disabled', !this.checked);
      $("#start-time-end").attr('disabled', !this.checked);
  });
  $("#date-check").click(function(){
      $("#date-start").attr('disabled', !this.checked);
      $("#date-end").attr('disabled', !this.checked);
  });
  $("#duration-check").click(function(){
      $("#duration-min").attr('disabled', !this.checked);
      $("#duration-max").attr('disabled', !this.checked);
  });
  $("#generate-query-button").click(generateQuery);
  $("#send-query").click(query);
}


/**
 * Returns a hyperlink eement (a) that links to a download page for the file given.
 */
function parseFileLocation(fileName) {
  linkElement = document.createElement("a");
  uri = "/api/v1/getFile\?file\="+encodeURI(fileName);
  linkElement.setAttribute('href', uri);
  linkElement.setAttribute('target', '_blank');
  linkElement.innerHTML = 'Download';
  return linkElement;
}

function parseRecordingDateTime(date) {
  var pElement = document.createElement("p");
  var d = new Date(date);
  pElement.innerHTML = d.getDate() +"/"+(d.getMonth()+1)+"/"+d.getFullYear();
  return pElement;
}

function parseDuration(duration) {
  var pElement = document.createElement("p");
  var minutes = Math.floor(duration / 60);
  var seconds = duration % 60;
  pElement.innerHTML = pad(minutes, 2)+":"+pad(seconds, 2);
  return pElement;
}

function parseVideoId(id) {
  var linkElement = document.createElement("a");
  uri = "/ViewVideo/"+id
  linkElement.setAttribute('href', uri);
  linkElement.setAttribute('target', '_blank');
  linkElement.innerHTML = 'View Recording'
  return linkElement;
}

function parseTags(tags) {
  var p = document.createElement("p");
  p.innerHTML = JSON.stringify(tags);
  return p;
}

function pad(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
