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

util.parseUrl = function(url) {
  var td = document.createElement("td");
  if (typeof url != 'string') {
    td.innerHTML = "No file.";
    return td;
  }
  var a = document.createElement("a");
  a.href = url;
  a.innerHTML = "Download";
  td.appendChild(a);
  return td;
};

util.parseGroup = function(groupId) {
  var td = document.createElement("td");
  if (typeof groupId !== 'number') {
    td.innerHTML = 'No group';
  } else {
    td.innerHTML = groupId;
  }
  return td;
};
