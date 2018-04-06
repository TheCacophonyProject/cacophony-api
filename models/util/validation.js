
// Validated that input is a valid [latitude, longitude]
function isLatLon(point) {
  var val = point.coordinates;
  if (
    val === null ||
    typeof val !== 'object' ||
    val.length !== 2 ||
    typeof val[0] !== 'number' ||
    typeof val[1] !== 'number' ||
    val[0] < -90 || 90 < val[0] ||
    val[1] < -180 || 180 <= val[1]
  ) {throw new Error('Location is not valid.');}
}

exports.isLatLon = isLatLon;
