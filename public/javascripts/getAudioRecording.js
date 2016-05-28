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
  console.log(fullRes);
  fullRes = JSON.parse(fullRes);
  res = [];
  for (var dp in fullRes) {
    var dataPoint = {};
    dataPoint["id"] = fullRes[dp].id
    dataPoint["startTimestamp"] = fullRes[dp].audioFileId.startTimestamp;
    dataPoint["duration"] = fullRes[dp].audioFileId.duration;
    dataPoint["fileLocation"] = fullRes[dp].audioFileId.fileLocation;
    dataPoint["latitude"] = fullRes[dp].locationId.latitude;
    dataPoint["longitude"] = fullRes[dp].locationId.longitude;
    res.push(dataPoint);
  }




  console.log(res);
  var tbl = document.getElementById('results-table') // table reference
  $("#results-table tr").remove();
  $("#key-select li").remove();
  console.log(tbl);
  var row;
  var cell;
  var i = 0;

  //Creating column lables and dropdown
  row = tbl.insertRow(0);
  var dropdown = document.getElementById("key-select");
  console.log(dropdown);
  var ddKey;
  console.log(res[0]);
  for (var key in res[0]) {
    cell = row.insertCell(i);
    cell.id = key+"-column";
    cell.innerHTML = key;

    ddKey = document.createElement("li");
    var id = "dd-"+key;
    var child = document.createElement("a");
    child.innerHTML = "&#10004"+key;
    child.id = "dd-"+key;
    child.col = i;
    child.onclick = toggleColumn;
    ddKey.appendChild(child);
    queryColums[key] = ddKey;
    dropdown.appendChild(ddKey);
    i++;
  }



  //Filling table with results.
  for (var model in res) {
    row = tbl.insertRow(tbl.rows.length);
    i = 0;
    for (var key in res[model]) {
      cell = row.insertCell(i);
      cell.innerHTML = res[model][key];
      i++
    }
  }
  document.getElementById('result').value = res;
}

function queryError(err) {
  window.alert(JSON.stringify(err));
  console.log("Error with query");
  document.getElementById('result').value = "err"
}

function toggleColumn(ele) {
  ele = ele.target;
  var key = ele.key;
  console.log(ele.col);
  if (ele.innerHTML.substr(0, 1) == "✔") {
    ele.innerHTML = ele.innerHTML.substr(1);
    showHideColumn(ele.col, false);
  } else {
    ele.innerHTML = "&#10004"+ele.innerHTML;
    showHideColumn(ele.col, true);
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
