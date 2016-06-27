/**
 * Does an API get request for an audio recording using the value in the userQuery element.
 */
function query() {
  console.log("Quering with:");
  var q = document.getElementById('query-input').value;
  $.ajax({
    url: '/api/v1/audioRecordings\?q\='+encodeURI(q),
    type: 'GET',
    success: queryDone,
    error: queryError
  });
}

/**
 * Called on an successful query.
 * Clears the results-table and fill with new results
 */
function queryDone(fullRes) {
  fullRes = JSON.parse(fullRes);
  clearTable();
  for (var res in fullRes) {
    var row = addEmptyRow();

    // Parsing through Audio Recording fields.
    for (var field in arFields) {
      if (fullRes[res][field]) {

        var index;  // Column index
        var cell;     // Cell element
        if (arFields[field].isChildModel) {
          var arCmFields = arFields[field];

          // Parsing through fields of child models.
          for (cmField in arCmFields) {
            if (cmField != "isChildModel") {
              // Adding child field.
              index = arCmFields[cmField].columnIndex;
              cell = row.cells[index];
              var parseFunction = arCmFields[cmField].parseFunction;
              if (parseFunction) { // Has customem parse function.
                cell.appendChild(parseFunction(fullRes[res][field][cmField]));
              } else {
                cell.innerHTML = fullRes[res][field][cmField];
              }

              if (!arFields[field][cmField].show) {
                $(cell).hide();
              }
            }
          }
        } else {
          // Adding field
          index = arFields[field].columnIndex;
          cell = row.cells[index];
          cell.innerHTML = fullRes[res][field];
        }
      }
    }
  }
}

function queryError(err) {
  window.alert(JSON.stringify(err));
  console.log("Error with query");
  document.getElementById('result').value = "err"
}

/**
 * Toggle the column view for the given element.
 */
function toggleColumn(ele) {
  ele = ele.target;
  var key = ele.key;
  var show;

  //Finding if the element is to be hidden or not.
  if (ele.isChildField) { //Methods of getting the current state differ if is is a child fied.
    show = !arFields[ele.field][ele.childField].show; //Oposite of what is currently is
    arFields[ele.field][ele.childField].show = show;
  } else {
    show = !arFields[ele.field].show; //Oposite of what it currently is.
    arFields[ele.field].show = show;
  }

  // Adding/removing the <tick> symbol from the dropdown menu
  if (show) {
    ele.innerHTML = "&#10004"+ele.innerHTML;
    showHideColumn(ele.columnIndex, true);
  } else {
    ele.innerHTML = ele.innerHTML.substr(1);
    showHideColumn(ele.columnIndex, false);
  }
}

function showHideColumn(nthChild, show) {
  nthChild++;
  if (show){
    $('td:nth-child('+nthChild+')').show();
  } else {
    $('td:nth-child('+nthChild+')').hide();
  }
}


var queryColums = {};

/**
 * Generates the colums for the results-table.
 * Makes a column from each field in the arFields variable.
 * Will
 *
 */
function generateTableColumns() {
  var table = document.getElementById('results-table');
  var dm = document.getElementById('key-select');
  table.insertRow(0);
  for (var field in arFields) {
    var liElement = document.createElement("li");
    var aElement = document.createElement("a");
    aElement.href = "#";
    //aElement.onclick = "toggleColumn";
    aElement.innerHTML = field;
    // Parse through child model fields
    if (arFields[field].isChildModel) {
      var childModelFields = arFields[field];
      var childUlElement = document.createElement("ul");
      childUlElement.className = "dropdown-menu";
      liElement.className = "dropdown-submenu";

      for (var childField in childModelFields) {
        if (childField != "isChildModel") {
          // Add new column for child field and saving index of column.
          var childFieldName = field+"_"+childField
          childModelFields[childField].columnIndex = appendColumn(childFieldName);
          // Adding child submenu element.
          var childLiElement = document.createElement("li");
          var childAElement = document.createElement("a");
          childAElement.href = "#";
          if (childModelFields[childField].show) {
            childAElement.innerHTML = "✔"+childField;
          } else {
            childAElement.innerHTML = childField;
          }
          showHideColumn(childModelFields[childField].columnIndex, childModelFields[childField].show);
          childAElement.onclick = toggleColumn;
          childAElement.columnIndex = childModelFields[childField].columnIndex;
          childAElement.childField = childField;
          childAElement.isChildField = true;
          childAElement.field = field;
          //childLiElement.onclick = toggleColumn;
          childLiElement.appendChild(childAElement);
          childUlElement.appendChild(childLiElement);
        }
      }
      // Add dropdown-menu
      liElement.appendChild(aElement);
      liElement.appendChild(childUlElement);
      dm.appendChild(liElement);
    }
    // Add new column for field and saving index of column.
    else {
      arFields[field].columnIndex = appendColumn(field);
      if (arFields[field].show) {
        aElement.innerHTML = "✔"+field;
      } else {
        aElement.innerHTML = field;
      }
      showHideColumn(arFields[field].columnIndex, arFields[field].show);
      aElement.onclick = toggleColumn;
      aElement.columnIndex = arFields[field].columnIndex;
      aElement.isChildField = false;
      aElement.field = field;
      liElement.appendChild(aElement);
      dm.appendChild(liElement);
    }
  }
  console.log(arFields);
}

/**
 * Adds a column to the resuts table with the given name.
 * Returns the column index.
 */
function appendColumn(name) {
  console.log("Appending column:", name);
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
  var row = table.insertRow(table.rows.length);
  for (var i = 0; i < table.rows[0].cells.length; i++) {
    var cell = row.insertCell(i);
  }
  return row;
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
  generateTableColumns();

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

function generateQuery() {
  console.log("Generating query.");
  var query = {};
  // Recording Time
  if ($("#start-time-check")[0].checked) {
    if (!query.audioFile) query.audioFile = {};
    query.audioFile.startTimestamp = {$gte: $("#start-time-start")[0].value, $lte: $("#start-time-end")[0].value};
  }
  // Recording Date
  if ($("#date-check")[0].checked) {
    if (!query.audioFile) query.audioFile = {};
    query.audioFile.recordingDate = {$gte: $("#date-start")[0].value, $lte: $("#date-end")[0].value};
  }
  // Recording Duration
  if ($("#duration-check")[0].checked) {
    if (!query.audioFile) query.audioFile = {};
    query.audioFile.duration = {$gte: $("#duration-min")[0].value, $lte: $("#duration-max")[0].value};
  }

  $("#query-input")[0].value = JSON.stringify(query);

}

// JSON of the fields in the audio recording.
// TODO, auto generate this from model.
// This is used in creting the table and getting the results from a query.
// The parseunctions are uses to generate the element that spans the cell in the tabe.
var arFields = {
  id: {show: true},
  audioFileId: {
    isChildModel: true,
    startTimestamp: {show: true},
    recordingDateTime: {show: true, parseFunction: parseRecordingDateTime},
    duration: {show: true, parseFunction: parseDuration},
    fileLocation: {show: true, parseFunction: parseFileLocation}
  },
  locationId: {
    isChildModel: true,
    latitude: {show: false},
    longitude: {show: false}
  }
}

/**
 * Returns a hyperlink eement (a) that links to a download page for the file given.
 */
function parseFileLocation(fileName) {
  linkElement = document.createElement("a");
  uri = "/api/v1/getFile\?file\="+encodeURI(fileName);
  linkElement.setAttribute('href', uri);
  linkElement.innerHTML = 'Download';
  return linkElement;
}

function parseRecordingDateTime(date) {
  var pElement = document.createElement("p");
  var d = new Date(date);
  pElement.innerHTML = d.getDay() +"/"+d.getMonth()+1+"/"+d.getFullYear();
  return pElement;
}

function parseDuration(duration) {
  var pElement = document.createElement("p");
  var minutes = Math.floor(duration / 60);
  var seconds = duration % 60;
  pElement.innerHTML = pad(minutes, 2)+":"+pad(seconds, 2);
  return pElement;
}

function pad(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}
