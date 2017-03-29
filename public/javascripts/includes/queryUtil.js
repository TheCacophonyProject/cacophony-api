queryUtil = {};

queryUtil.conditions = {};
queryUtil.nextId = 1;
queryUtil.count = 54;

queryUtil.addCondition = function(sequelizeCondition) {
  console.log('Add condition:', sequelizeCondition);
  var id = queryUtil.nextId++;
  queryUtil.conditions[id] = sequelizeCondition;
  queryUtil.updateConditions();
};

queryUtil.deleteCondition = function(id) {
  console.log('Delete condition: ', id);
  delete queryUtil.conditions[id];
  queryUtil.updateConditions();
};

queryUtil.updateConditions = function() {
  console.log('Update conditions');
  var conditions = document.getElementById('conditions');
  conditions.innerHTML = '';
  for (var i in queryUtil.conditions) {
    var l = document.createElement('label');
    var deleteButton = document.createElement('input');
    deleteButton.setAttribute('type', 'button');
    deleteButton.value = 'Delete';
    deleteButton.setAttribute(
      'onclick', 'queryUtil.deleteCondition(' + i + ')');
    var br = document.createElement('br');
    l.innerHTML = JSON.stringify(queryUtil.conditions[i]);
    conditions.appendChild(l);
    conditions.appendChild(deleteButton);
    conditions.appendChild(br);
  }
};

queryUtil.fromConditions = function() {
  var query = {};
  for (var i in queryUtil.conditions) {
    var condition = queryUtil.conditions[i];
    for (var key in condition) {
      if (query[key] === undefined) query[key] = {};
      // If condition is an object append each condition. {duration: {$lt: 4}}
      if (typeof condition[key] === 'object') {
        for (var j in condition[key])
          query[key][j] = condition[key][j];
      }
      // If not a object just set key to that value. {id: 1}
      else {
        query[key] = condition[key];
      }
    }
  }
  document.getElementById('active-query').value = JSON.stringify(query);
  queryUtil.sendQuery();
};

// Add conditions

queryUtil.addBeforeDate = function() {
  var date = document.getElementById('before-date').value;
  var sequelizeCondition = {
    recordingDateTime: { "$lt": date }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addAfterDate = function() {
  var date = document.getElementById('after-date').value;
  var sequelizeCondition = {
    recordingDateTime: { "$gt": date }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addBeforeTime = function() {
  var time = document.getElementById('before-time').value;
  var sequelizeCondition = {
    recordingTime: { "$lt": time }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addAfterTime = function() {
  var time = document.getElementById('after-time').value;
  var sequelizeCondition = {
    recordingTime: { "$gt": time }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addLongerThan = function() {
  var duration = document.getElementById('longer-than').value;
  var sequelizeCondition = {
    duration: { "$gt": duration }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addShorterThan = function() {
  var duration = document.getElementById('shorter-than').value;
  var sequelizeCondition = {
    duration: { "$lt": duration }
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.addDeviceId = function() {
  var id = Number(document.getElementById('device-id').value);
  var sequelizeCondition = {
    id: id,
  };
  queryUtil.addCondition(sequelizeCondition);
};

queryUtil.inc = function() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  if (offsetN + limitN < queryUtil.count) {
    offset.value = offsetN + limitN;
  }
  queryUtil.sendQuery();
};

queryUtil.dec = function() {
  var offset = document.getElementById('offset');
  var offsetN = Number(offset.value);
  var limitN = Number(document.getElementById('limit').value);
  var newOffsetVal = offsetN - limitN;
  if (newOffsetVal <= 0)
    newOffsetVal = 0;
  offset.value = newOffsetVal;
  queryUtil.sendQuery();
};

queryUtil.getAll = function() {
  document.getElementById('active-query').value = '{}';
  queryUtil.sendQuery();
};

queryUtil.sendQuery = function() {
  queryUtil.clearTable();
  var query = document.getElementById('active-query').value;
  var limit = Number(document.getElementById('limit').value);
  var offset = Number(document.getElementById('offset').value);
  var headers = {
    where: query,
    limit: limit,
    offset: offset,
  };
  var jwt = sessionStorage.getItem('token');
  if (jwt)
    headers.Authorization = jwt;

  $.ajax({
    url: apiUrl,
    type: 'GET',
    headers: headers,
    success: function(res) {
      console.log('Successful request:', res);
      if (res.result.count === 0)
        window.alert('No results for query.');
      for (var i in res.result.rows)
        queryUtil.appendModelToTable(res.result.rows[i]);
      document.getElementById('offset').value = res.result.offset;
      document.getElementById('limit').value = res.result.limit;
      queryUtil.count = res.result.count;
      document.getElementById('count').innerHTML = queryUtil.count +
        ' results.';
    },
    error: function(err) {
      window.alert('Error with query.');
      console.log('Error:', err);
    },
  });
};

queryUtil.clearTable = function() {
  var table = document.getElementById('results-table');
  var rowCount = table.rows.length;
  while (--rowCount) table.deleteRow(rowCount);
};

queryUtil.appendModelToTable = function(model) {
  var table = document.getElementById('results-table');
  var newRow = table.insertRow(table.rows.length);
  var tableData = getTableData();
  newRow.appendChild(queryUtil.modelViewElement(model));
  for (var i in tableData) {
    var value = model[tableData[i].modelField];
    newRow.appendChild(tableData[i].parseFunction(value));
  }
  newRow.appendChild(queryUtil.modelDeleteDatapoint(model, newRow));
};

queryUtil.modelViewElement = function(model) {
  var link = document.createElement("a");
  link.setAttribute('href', viewUrl + model.id);
  link.setAttribute('target', '_blank');
  link.innerHTML = 'View';
  var td = document.createElement("td");
  td.appendChild(link);
  return td;
};

queryUtil.modelDeleteDatapoint = function(model, row) {
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
};

queryUtil.parseNumber = function(number) {
  //TODO parse this..
  var td = document.createElement("td");
  td.innerHTML = number;
  return td;
};

queryUtil.parseLocation = function(location) {
  var td = document.createElement("td");
  if (location && typeof location === 'object') {
    var latitude = location.coordinates[0];
    var longitude = location.coordinates[1];
    //TODO parse this....
    td.innerHTML = latitude + ', ' + longitude;
    return td;
  }
  td.innerHTML = 'No location.';
  return td;
};

queryUtil.parseDuration = function(duration) {
  //TODO parse this...
  var td = document.createElement("td");
  td.innerHTML = duration;
  return td;
};

queryUtil.parseTimeOnly = function(time) {
  //TODO parse this...
  var td = document.createElement("td");
  td.innerHTML = time;
  return td;
};

queryUtil.parseDateOnly = function(date) {
  //TODO parse this...
  var td = document.createElement("td");
  td.innerHTML = date;
  return td;
};

queryUtil.parseDownload = function(id) {
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

queryUtil.parseString = function(string) {
  var td = document.createElement("td");
  td.innerHTML = string;
  return td;
};

queryUtil.parseBoolean = function(boolean) {
  var td = document.createElement("td");
  td.innerHTML = boolean;
  return td;
};

queryUtil.parseGroup = function(group) {
  var td = document.createElement("td");
  if (typeof group !== 'string') {
    td.innerHTML = 'No group';
  } else {
    td.innerHTML = group;
  }
  return td;
};
