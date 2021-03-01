import json
from datetime import datetime
import dateutil.parser

import pytest
from .testexception import UnprocessableError, AuthorizationError, BadRequestError


# Add stations
class TestStations:
    def test_add_stations(self, helper):
        station_user = helper.given_new_user(self, "station_admin")
        station_group_name = helper.make_unique_group_name(self, "stationGroup")
        # NOTE: user is automatically added to any group they create as an admin.
        station_group = station_user.create_group_and_return_response(station_group_name)

        # Try to add stations to group without supplying stations JSON
        with pytest.raises(UnprocessableError) as error:
            station_user.add_stations_to_group(station_group["groupId"])
        print("Error:", json.loads(str(error.value))["errors"])

        # Try to add stations to group supplying json of empty array
        with pytest.raises(UnprocessableError) as error:
            station_user.add_stations_to_group(station_group["groupId"], json.dumps([]))
        print("Error:", json.loads(str(error.value))["errors"])

        # Try to add stations with malformed JSON - missing lat/lng/name?
        print("Try to add stations with malformed JSON - missing fields, etc")
        # NOTE: A station json representation looks like:
        # {
        #   name: string;
        #   lat: number;
        #   lng: number;
        # }
        with pytest.raises(UnprocessableError) as error:
            station_user.add_stations_to_group(
                station_group["groupId"], json.dumps([{"name": "Station name"}])
            )
        print("Error:", json.loads(str(error.value))["errors"])

        with pytest.raises(UnprocessableError):
            station_user.add_stations_to_group(
                station_group["groupId"],
                json.dumps(
                    [
                        {"name": "Station name", "lat": -43.5338773, "lng": 172.6451473},
                        {
                            "name": "Station name without lat/lng",
                        },
                    ]
                ),
            )

        added_station_ids = station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps([{"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894}]),
        )
        print("Added stations", added_station_ids["stationIdsAddedOrUpdated"])
        assert len(added_station_ids["stationIdsAddedOrUpdated"]) == 1

        print(
            "Make we warn about added stations that are too close to any others (we don't really want overlapping stations)"
        )
        too_close_warnings = station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps(
                [
                    {"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894},
                    {"name": "Too close station", "lat": -43.62367657911904, "lng": 172.62626365029485},
                ]
            ),
        )
        assert too_close_warnings["warnings"]

        # Make a fresh group for the next part
        station_group_name = helper.make_unique_group_name(self, "stationGroup")
        # NOTE: user is automatically added to any group they create as an admin.
        station_group = station_user.create_group_and_return_response(station_group_name)

        print("Existing stations that are missing when uploading new stations should be set to 'retired'")
        added_station_ids = station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps(
                [
                    {"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894},
                    {"name": "Will be retired", "lat": -43.62367659982135, "lng": 172.8},
                ]
            ),
        )
        assert len(added_station_ids["stationIdsAddedOrUpdated"]) == 2

        added_station_ids = station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps([{"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894}]),
        )
        assert len(added_station_ids["stationIdsAddedOrUpdated"]) == 1
        added_station_id = added_station_ids["stationIdsAddedOrUpdated"][0]
        print("Added", added_station_ids, added_station_id)

        # Get stations and make sure that "Will be retired" exists and is retired
        current_stations = station_user.get_stations_for_group(station_group["groupId"])
        retired = [x for x in current_stations["stations"] if x["name"] == "Will be retired"]
        assert len(retired) == 1
        assert retired[0]["retiredAt"] is not None

        # Get stations and make sure that "Will be retired" exists and is retired (getting group by name)
        current_stations = station_user.get_stations_for_group(station_group_name)
        retired = [x for x in current_stations["stations"] if x["name"] == "Will be retired"]
        assert len(retired) == 1
        assert retired[0]["retiredAt"] is not None

        print("Adding stations with updated lat/lng but same name should update the lat/lng")
        added_station_ids = station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps([{"name": "Station name", "lat": -43.62367659982136, "lng": 172.62646754}]),
        )
        print("Should Update lat lng", added_station_ids)
        # Id should not have changed, since the lat/lng was updated.
        assert added_station_ids["stationIdsAddedOrUpdated"][0] == added_station_id
        print("Update lat lng", added_station_ids)

        other_station_user = helper.given_new_user(self, "other_station_admin")
        other_station_group_name = helper.make_unique_group_name(self, "stationGroup")
        other_station_group = other_station_user.create_group_and_return_response(other_station_group_name)

        print("Try to list stations for a group the user is not part of")
        with pytest.raises(AuthorizationError) as error:
            other_station_user.get_stations_for_group(station_group["groupId"])
        print("Error", json.loads(str(error.value))["messages"][0])

        print("Try to add stations to a group where user isn't a member of the group")
        with pytest.raises(AuthorizationError) as error:
            station_user.add_stations_to_group(
                other_station_group["groupId"],
                json.dumps([{"name": "Station name 2", "lat": -43.5338773, "lng": 172.6451473}]),
            )
        print("Error:", json.loads(str(error.value))["messages"][0])

        other_station_user.add_to_group(station_user, other_station_group_name)

        print("Try to add stations to a group where user doesn't have permissions")
        with pytest.raises(AuthorizationError) as error:
            station_user.add_stations_to_group(
                other_station_group["groupId"],
                json.dumps([{"name": "Station name 2", "lat": -43.5338773, "lng": 172.6451473}]),
            )
        print("Error:", json.loads(str(error.value))["messages"][0])

        print("Try to add stations to a non-existing group id")
        with pytest.raises(UnprocessableError) as error:
            station_user.add_stations_to_group(
                99999, json.dumps([{"name": "Station name 2", "lat": -43.5338773, "lng": 172.6451473}])
            )

        print("Error:", json.loads(str(error.value))["message"])

        # Handle edge case where a station with a given name is retired, and then later another station with
        # the same name is added.  In this case we'd want to keep the new station, not update the retired station.
        added_station_ids = station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps(
                [
                    {"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894},
                    {"name": "Will be retired", "lat": -43.623676599, "lng": 172.8343},
                ]
            ),
        )
        assert retired[0]["id"] not in added_station_ids
        print("Added station with same name as retired station", added_station_ids)

        # Make sure that if that station gets retired again, we retire the correct version
        station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps([{"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894}]),
        )

        # Get stations and make sure that "Will be retired" exists and is retired (getting group by name)
        current_stations = station_user.get_stations_for_group(station_group_name)
        retired = [
            x
            for x in current_stations["stations"]
            if x["name"] == "Will be retired" and x["retiredAt"] is not None
        ]
        assert len(retired) == 2

    def test_adding_recordings_matched_to_stations(self, helper):
        print("Add a group with a station which should be matched")

        station_user = helper.given_new_user(self, "station_admin")
        station_group_name = helper.make_unique_group_name(self, "stationGroup")
        station_group = station_user.create_group_and_return_response(station_group_name)
        added_station_ids = station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps([{"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894}]),
        )
        print("Added stations", added_station_ids["stationIdsAddedOrUpdated"])
        assert len(added_station_ids["stationIdsAddedOrUpdated"]) == 1

        station_to_match_id = added_station_ids["stationIdsAddedOrUpdated"][0]
        print("Create new recording that should match the 1 existing station, as it is close enough")
        created_recording = helper.given_a_recording(
            self, group=station_group_name, props={"location": [-43.623704659672676, 172.6267505162639]}
        )
        assert created_recording

        print(
            "Get the data for the uploaded recording, and see which station (if any) it has been matched to"
        )
        recording = station_user.get_recording_by_id(created_recording.id_)
        assert recording["StationId"] == station_to_match_id

        print("Add some recordings which should not be matched to any station")
        created_recording = helper.given_a_recording(
            self, group=station_group_name, props={"location": [-43.5, 172.6]}
        )
        assert created_recording

        recording = station_user.get_recording_by_id(created_recording.id_)
        assert recording["StationId"] is None

    def test_backdating_new_stations_to_existing_recordings(self, helper):
        print("Add a recording, then add a station and back-date matches")
        station_user = helper.given_new_user(self, "station_admin")
        station_group_name = helper.make_unique_group_name(self, "stationGroup")
        station_group = station_user.create_group_and_return_response(station_group_name)

        created_recording = helper.given_a_recording(
            self, group=station_group_name, props={"location": [-43.623704659672676, 172.6267505162639]}
        )
        assert created_recording
        recording = station_user.get_recording_by_id(created_recording.id_)
        assert recording["StationId"] is None

        one_minute_ago = datetime.fromtimestamp(
            datetime.now().timestamp() - 60, dateutil.tz.gettz("Pacific/Auckland")
        )
        station_user.add_stations_to_group(
            station_group["groupId"],
            json.dumps([{"name": "Station name", "lat": -43.62367659982135, "lng": 172.62646754804894}]),
            fromDate=one_minute_ago.isoformat(),
        )

        recording = station_user.get_recording_by_id(created_recording.id_)
        assert recording["StationId"] is not None
