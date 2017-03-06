var queryJson = {};
var limit = 20;
var offset = 0;
var count = 0;

function query() {
  util.clearTable();
  var q = $("#query-input")[0].value;
  limit = $("#respult-per-page")[0].value;
  headers = { where: q, limit: limit, offset: offset };
  var jwt = sessionStorage.getItem('token');
  if (jwt) {
    headers.Authorization = jwt;
  }
  $.ajax({
    url: apiUrl,
    type: 'GET',
    headers: headers,
    success: queryDone,
    error: queryError
  });
}

function queryError(err) {
  console.log("Query error.");
  console.log(err);
  window.alert(err);
}

function queryDone(response) {
  console.log(response);
  if (response.result.count === 0) {
    window.alert('No results for query.');
  }
  for (var row in response.result.rows) {
    appendModelToTable(response.result.rows[row]);
  }
  var text = document.getElementById('results-text');
  offset = response.result.offset;
  limit = response.result.limit;
  var start = offset + 1;
  var end = offset +
    Math.min(response.result.rows.length, limit);
  count = response.result.count;
  var str = "Showing " + start + "-" + end + " of " + count;

  text.innerHTML = str;
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

function modelDeleteDatapoint(model, row) {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.innerHTML = "Delete";
  var headers = {};
  var jwt = sessionStorage.getItem('token');
  if (jwt) { headers.Authorization = jwt; }
  var id = model.id;
  button.onclick = function() {
    var url = apiUrl + '/' + id;
    $.ajax({
      url: url,
      type: 'DELETE',
      headers: headers,
      success: function(result) {
        console.log("File deleted. ", result);
        console.log(row);
        row.parentNode.removeChild(row);
        window.alert("Datapoint deleted.");
      },
      error: function(err) {
        console.log(err);
        window.alert("Failed deleting datapoint.");
      },
    });
  };
  td.appendChild(button);
  return td;
}

modelViewElement = function(model) {
  var link = document.createElement("a");
  link.setAttribute('href', viewUrl + model.id);
  link.setAttribute('target', '_blank');
  link.innerHTML = 'View';
  var td = document.createElement("td");
  td.appendChild(link);
  return td;
};

function generateQuery() {
  var query = {};
  console.log("Generating query.");
  if ($("#start-time-check")[0].checked) {
    query.recordingTime = util.sequelize.timeRangeGen(
      $("#start-time-start")[0],
      $("#start-time-end")[0]
    );
  }
  if ($("#date-check")[0].checked) {
    query.recordingDateTime = util.sequelize.dateOnlyRangeGen(
      $("#date-start")[0],
      $("#date-end")[0]
    );
  }
  if ($("#duration-check")[0].checked) {
    query.duration = util.sequelize.durationRangeGen(
      $("#duration-min")[0],
      $("#duration-max")[0]
    );
  }
  $("#query-input")[0].value = JSON.stringify(query);
  queryJson = query;
}

function nextResults() {
  if (offset + limit < count) {
    offset = offset + limit;
    query();
  }
}

function previousResults() {
  if (offset > 0) {
    offset = offset - limit;
    if (offset <= 0) {
      offset = 0;
    }
    query();
  }
}

window.onload = function() {
  $("#start-time-check").click(function() {
    $("#start-time-start").attr('disabled', !this.checked);
    $("#start-time-end").attr('disabled', !this.checked);
  });
  $("#date-check").click(function() {
    $("#date-start").attr('disabled', !this.checked);
    $("#date-end").attr('disabled', !this.checked);
  });
  $("#duration-check").click(function() {
    $("#duration-start").attr('disabled', !this.checked);
    $("#duration-end").attr('disabled', !this.checked);
  });
  $("#generate-query-button").click(generateQuery);
  $("#send-query").click(query);
  $("#next-results").click(nextResults);
  $("#previous-results").click(previousResults);
};
