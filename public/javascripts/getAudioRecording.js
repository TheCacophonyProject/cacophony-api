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

function queryDone(fullRes) {
  fullRes = JSON.parse(fullRes);
  console.log(fullRes);
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
            cell.innerHTML = fullRes[res][field][cmField];
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

function toggleColumn(ele) {
  ele = ele.target;
  var key = ele.key;
  var show;

  //Finding if the element is to be hidden or not.
  if (ele.isChildField) {
    show = !arFields[ele.field][ele.childField].show; //Oposite of what is currently is
    arFields[ele.field][ele.childField].show = !arFields[ele.field][ele.childField].show;
  } else {
    show = !arFields[ele.field].show; //Oposite of what it currently is.
    arFields[ele.field].show = !arFields[ele.field].show;
  }
  //console.log(show);

  if (show) {
    ele.innerHTML = "&#10004"+ele.innerHTML;
    showHideColumn(ele.columnIndex, true);
  } else {
    ele.innerHTML = ele.innerHTML.substr(1);
    showHideColumn(ele.columnIndex, false);
  }

}

function showHideColumn(nthChild, show) {
  console.log(++nthChild);
  if (show){
    $('td:nth-child('+nthChild+')').show();
  } else {
    $('td:nth-child('+nthChild+')').hide();
  }
}


var queryColums = {};

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

function appendColumn(name) {
  console.log("Appending column:", name);
  var table = document.getElementById('results-table');
  var row = table.rows[0];
  var index = row.cells.length;
  var columnLable = row.insertCell(index);
  columnLable.innerHTML = name;
  return index;
}

function addEmptyRow() {
  var table = document.getElementById('results-table');
  var row = table.insertRow(table.rows.length);
  for (var i = 0; i < table.rows[0].cells.length; i++) {
    var cell = row.insertCell(i);
  }
  return row;
}

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

function clearTable() {
  var table = document.getElementById('results-table');
  var rowCount = table.rows.length;
  while(--rowCount) table.deleteRow(rowCount);
}

window.onload = function() {
  generateTableColumns();
}
