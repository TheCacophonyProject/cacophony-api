var util = {};
util.sequelize = {};

util.sequelize.dateOnlyRangeGen = function(start, end) {
  var result = {};
  //TODO set start time to 00:00:00 and end time to 23:59:59
  //TODO don't add values if they are not set.
  //TODO check that input is valid.
  result.$gte = start.value;
  result.$lte = end.value;
  return result;
};

util.sequelize.dateTimeRangeGen = function(start, end) {
  var result = {};
  //TODO don't add values if they are not set.
  //TODO check that input is valid.
  result.$gte = start.value;
  result.$lte = end.value;
  return result;
};

util.sequelize.timeRangeGen = function(start, end) {
  var result = {};
  //TODO don't add values that are not set.
  //TODO check that input is valid.
  result.$gte = start.value;
  result.$lte = end.value;
  return result;
};

util.sequelize.durationRangeGen = function(low, high) {
  var result = {};
  //TODO dont add values if they are not set..
  //TODO there is a range sequelize query?
  //TODO check that input is valid.
  result.$gte = low.value;
  result.$lte = high.value;
  return result;
};


/**
 * Adds an empty row to results-table.
 * Returns the row number.
 */
util.getNewEmptyRow = function() {
  var table = document.getElementById('results-table');
  var newRow = table.insertRow(table.rows.length);
  return newRow;
};

/**
 * This clears the result table apart from the first row.
 */
util.clearTable = function() {
  var table = document.getElementById('results-table');
  var rowCount = table.rows.length;
  while (--rowCount) table.deleteRow(rowCount);
};

util.appendModelToTable = function(model) {
  var newRow = util.getNewEmptyRow();
  console.log(newRow);
  var tableData = getTableData();
  for (var i in tableData) {
    var value = model[tableData[i].modelField];
    newRow.appendChild(tableData[i].parseFunction(value));
  }
};

util.parseNumber = function(number) {
  //TODO parse this..
  var td = document.createElement("td");
  td.innerHTML = number;
  return td;
};

util.parseLocation = function(location) {
  //TODO parse this....
  var td = document.createElement("td");
  td.innerHTML = location;
  return td;
};

util.parseDuration = function(duration) {
  //TODO parse this...
  var td = document.createElement("td");
  td.innerHTML = duration;
  return td;
};

util.parseTimeOnly = function(time) {
  //TODO parse this...
  var td = document.createElement("td");
  td.innerHTML = time;
  return td;
};

util.parseDateOnly = function(date) {
  //TODO parse this...
  var td = document.createElement("td");
  td.innerHTML = date;
  return td;
};

util.parseDownload = function(id) {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.innerHTML = "Download";

  var headers = {};
  var jwt = sessionStorage.getItem('token');
  if (jwt) {
    headers.Authorization = jwt;
  }

  button.onclick = function() {
    var headers = {};
    var jwt = sessionStorage.getItem('token');
    if (jwt) {
      headers.Authorization = jwt;
    }
    var url = apiUrl + '/' + id;
    $.ajax({
      url: url,
      type: 'GET',
      headers: headers,
      success: function(res) {
        var url = "/api/v1/signedUrl?jwt=" + res.jwt;
        var linkElement = document.createElement('a');
        linkElement.href = url;
        var click = document.createEvent('MouseEvents');
        click.initEvent('click', true, true);
        linkElement.dispatchEvent(click);
      },
      error: console.log,
    });
  };
  td.appendChild(button);
  return td;
};

util.parseGroup = function(group) {
  var td = document.createElement("td");
  if (typeof group !== 'string') {
    td.innerHTML = 'No group';
  } else {
    td.innerHTML = group;
  }
  return td;
};
