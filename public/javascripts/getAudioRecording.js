/**
 * Does an API get request for an audio recording using the value in the userQuery element.
 */
function query() {
  console.log("Quering with:");
  var q = document.getElementById('userQuery').value;
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
            if (cmField == "fileLocation") {
              cell.appendChild(fileLink(fullRes[res][field][cmField]));
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


// JSON of the fields in the audio recording.
// TODO, auto generate this from model.
// This is used in creting the table and getting the results from a query.
var arFields = {
  id: {show: true},
  audioFileId: {
    isChildModel: true,
    startTimestamp: {show: true},
    duration: {show: true},
    fileLocation: {show: true}
  },
  locationId: {
    isChildModel: true,
    latitude: {show: true},
    longitude: {show: false}
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

/**
 * Returns a hyperlink eement (a) that links to a download page for the file given.
 */
function fileLink(fileName) {
  linkElement = document.createElement("a");
  uri = "/api/v1/getFile\?file\="+encodeURI(fileName);
  linkElement.setAttribute('href', uri);
  linkElement.innerHTML = fileName;
  return linkElement;
}

window.onload = function() {
  generateTableColumns();
}
