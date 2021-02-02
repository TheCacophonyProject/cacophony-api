/*
cacophony-api: The Cacophony Project API server
Copyright (C) 2018  The Cacophony Project

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Validate that input is a valid [latitude, longitude]
function isLatLon(point) {
  const val = point.coordinates;
  if (
    val === null ||
    typeof val !== "object" ||
    !Array.isArray(val) ||
    val.length !== 2 ||
    typeof val[0] !== "number" ||
    typeof val[1] !== "number" ||
    val[0] < -90 ||
    90 < val[0] ||
    val[1] < -180 ||
    180 <= val[1]
  ) {
    throw new Error("Location is not valid.");
  }
}

export default { isLatLon };
