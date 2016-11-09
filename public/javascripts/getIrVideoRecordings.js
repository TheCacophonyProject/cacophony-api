function getTableData() {
  return [
    { tableName: "ID", modelField: "id", parseFunction: util.parseNumber },
    { tableName: "Device ID", modelField: "deviceId", parseFunction: util.parseNumber },
    { tableName: "Group ID", modelsField: "groupId", parseFunction: util.parseGroup },
    { tableName: "Location", modelField: "location", parseFunction: util.parseLocation },
    { tableName: "Time", modelField: "recordingTime", parseFunction: util.parseTimeOnly },
    { tableName: "Date", modelField: "recordingDateTime", parseFunction: util.parseDateOnly },
    { tableName: "Duration", modelField: "duration", parseFunction: util.parseDuration },
    { tableName: "File", modelField: "fileUrl", parseFunction: util.parseUrl }
  ];
}

var queryJson = {};

function query() {
  util.clearTable();
  var q = $("#query-input")[0].value;
  headers = { where: q };
  var jwt = sessionStorage.getItem('token');
  if (jwt) {
    headers.Authorization = jwt;
  }
  $.ajax({
    url: "api/v1/irVideoRecordings",
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

function queryDone(models) {
  console.log(models);
  if (models.result.length === 0) {
    window.alert('No results for query.');
  }
  for (var model in models.result) {
    appendModelToTable(models.result[model]);
  }
}

appendModelToTable = function(model) {
  var newRow = util.getNewEmptyRow();
  var tableData = getTableData();
  newRow.appendChild(modelViewElement(model));
  for (var i in tableData) {
    var value = model[tableData[i].modelField];
    newRow.appendChild(tableData[i].parseFunction(value));
  }
}

modelViewElement = function(model) {
  var link = document.createElement("a");
  link.setAttribute('href', '/view_ir_video_recording/'+model.id);
  link.setAttribute('target', '_blank');
  link.innerHTML = 'View';
  var td = document.createElement("td");
  td.appendChild(link);
  return td;
}

function generateQuery() {
  var query = {};
  console.log("Generating query.");
  if ($("#start-time-check")[0].checked) {
    query.recordingTime = util.sequelize.timeRangeGen(
      $("#start-time-start")[0],
      $("#start-time-end")[0]
    )
  }
  if ($("#date-check")[0].checked) {
    query.recordingDateTime = util.sequelize.dateOnlyRangeGen(
      $("#date-start")[0],
      $("#date-end")[0]
    )
  }
  if ($("#duration-check")[0].checked) {
    query.duration = util.sequelize.durationRangeGen(
      $("#duration-min")[0],
      $("#duration-max")[0]
    )
  }
  $("#query-input")[0].value = JSON.stringify(query);
  queryJson = query;
}

window.onload = function() {
  console.log("On load func.");
  //generateTableColumns(modelLayout);

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
}
