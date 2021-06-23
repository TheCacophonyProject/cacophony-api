import csv
import io
import pytest

from .testexception import TestException, AuthorizationError
from .recording import Recording
from .track import Track, TrackTag
from .testdevice import TestDevice
from typing import List


class TestUser:
    def __init__(self, username, userapi, email=None):
        self._userapi = userapi
        self.username = username
        self.email = email
        self._group = None

    def new_token(self, access=None, set_token=False):
        return self._userapi.token(access, set_token)["token"]

    def update(self, username=None, email=None, password=None):
        data = {}
        if username:
            data["username"] = username
        if email:
            data["email"] = email
        if password:
            data["password"] = password
        self._userapi.update_user(data)

    def reprocess_recordings(self, recordings, params=None):
        return self._userapi.reprocess_recordings(recordings, params)

    def reprocess(self, recording, params=None):
        return self._userapi.reprocess(recording.id_, params)

    def when_searching_for(self):
        return RecordingQueryPromise(self)

    def when_searching_for_tagmode_and_tags(self, tagmode, tags):
        return self.when_searching_for().tagmode(tagmode).tags(tags)

    def when_searching_for_tagmode(self, tagmode):
        return self.when_searching_for().tagmode(tagmode)

    def when_searching_for_tags(self, *tags):
        return self.when_searching_for().tags(tags)

    def get_recording(self, recording, params=None):
        return self._userapi.get_recording(recording.id_, params)

    def get_recording_by_id(self, recording_id, params=None):
        return self._userapi.get_recording(recording_id, params)

    def get_recording_needs_tag(self, device_id=None):
        return self._userapi.get_recording_needs_tag(device_id=device_id)

    def get_recording_response(self, recording, params=None):
        return self._userapi.get_recording_response(recording.id_, params)

    def query_recordings(self, **options):
        return self._userapi.query(**options)

    def query_visits(self, **options):
        return self._userapi.query_visits(**options)

    def can_see_recordings(self, *expected_recordings):
        self._can_see_recordings_with_query({}, *expected_recordings)

    def _can_see_recordings_with_query(self, queryParams, *expected_recordings):
        recordings = self._userapi.query(**queryParams)
        if not recordings:
            raise TestException("User '{}' could not see any recordings.".format(self.username))

        # Check presence of various fields
        r0 = recordings[0]
        assert r0["id"]
        assert r0["type"]
        assert r0["recordingDateTime"]
        assert r0["rawMimeType"]
        assert "fileMimeType" in r0
        assert r0["processingState"]
        assert r0["duration"] > 0
        assert "location" in r0
        assert "batteryLevel" in r0
        assert r0["DeviceId"]
        assert r0["GroupId"]

        _errors = []
        for testRecording in expected_recordings:
            if not self._recording_in_list(recordings, testRecording):
                _errors.append(
                    "User '{}' cannot see recording with id {}, name {}.".format(
                        self.username, testRecording.id_, testRecording.name
                    )
                )

        if _errors:
            recordingIds = "Recording ids seen are: "
            for recording in recordings:
                recordingIds += str(recording["id"])
                recordingIds += ","
            _errors.append(recordingIds)
            raise TestException(_errors)

    def cannot_see_recordings(self, *expected_recordings):
        self._cannot_see_recordings_with_query({}, *expected_recordings)

    def _cannot_see_recordings_with_query(self, queryParams, *expected_recordings):
        recordings = self._userapi.query(**queryParams)

        _errors = []
        for testRecording in expected_recordings:
            if self._recording_in_list(recordings, testRecording):
                _errors.append(
                    "User '{}' can see recording with id {}, name {}, but shouldn't be able to..".format(
                        self.username, testRecording.id_, testRecording.name
                    )
                )

        if _errors:
            raise TestException(_errors)

    def _recording_in_list(self, recordings, testRecording):
        for recording in recordings:
            if recording["id"] == testRecording.id_:
                return True
        return False

    def can_see_recording_from(self, testdevice):
        recordings = self._userapi.query(limit=1)
        assert recordings, "User '{}' could not see any recordings.".format(self.username)

        lastDevice = recordings[0]["Device"]["devicename"]
        assert (
            lastDevice == testdevice.devicename
        ), "Latest recording is from device '{}', not from '{}'".format(lastDevice, testdevice.devicename)

    def cannot_see_any_recordings(self):
        recordings = self._userapi.query(limit=10)
        if recordings:
            raise TestException(
                "User '{}' can see a recording from '{}'".format(
                    self.username, recordings[0]["Device"]["devicename"]
                )
            )

    def get_report(self, raw=False, **args):
        text = self._userapi.report(**args)
        if raw:
            return text.splitlines()
        return csv.DictReader(text.splitlines())

    def can_download_correct_recording(self, recording):
        r = self._userapi.get_recording_response(recording.id_)
        content = io.BytesIO()
        for chunk in self._userapi._download_signed(r["downloadRawJWT"]):
            content.write(chunk)
        assert content.getvalue() == recording.content
        assert len(content.getvalue()) == r["rawSize"]
        recv_props = r["recording"]

        props = recording.props.copy()

        if "relativeToDawn" not in props:
            props["relativeToDawn"] = None
        if "relativeToDusk" not in props:
            props["relativeToDusk"] = None

        # # These are expected to be there but the values aren't tested.
        del recv_props["Device"]
        del recv_props["Tags"]
        del recv_props["GroupId"]
        del recv_props["location"]
        if "rawMimeType" not in props:
            del recv_props["rawMimeType"]
        del recv_props["fileMimeType"]
        if "type" not in props:
            recv_props.pop("type", None)
        if "comment" not in props:
            recv_props.pop("comment", None)
        if "recordingTime" not in recv_props:
            props.pop("recordingTime", None)

        assert recv_props.pop("id") == recording.id_
        assert recv_props.pop("processingState") != "FINISHED"

        # # Time formatting may differ so these are handled specially.
        assertDateTimeStrings(recv_props.pop("recordingDateTime"), props.pop("recordingDateTime"))

        # Compare the remaining properties.
        assert_props_exist(props, recv_props)

    def cannot_download_recording(self, recording):
        with pytest.raises(AuthorizationError):
            self._userapi.get_recording(recording.id_)

    def delete_recording(self, recording):
        self._userapi.delete_recording(recording.id_)

    def update_recording(self, recording, **updates):
        self._userapi.update_recording(recording.id_, updates)
        recording.props.update(updates)

    def create_group_and_return_response(self, groupname):
        return self._userapi.create_group(groupname)

    def create_group(self, groupname, printname=True):
        self._userapi.create_group(groupname)
        if printname:
            print("({})".format(groupname))
        return groupname

    def get_user_details(self, user):
        return self._userapi.get_user_details(user.username)

    def tag_recording(self, recording, tagDictionary):
        return self._userapi.tag_recording(recording.id_, tagDictionary)

    def cannot_delete_recording_tag(self, tag_id):
        with pytest.raises(AuthorizationError):
            self._userapi.delete_recording_tag(tag_id)

    def delete_recording_tag(self, tag_id):
        return self._userapi.delete_recording_tag(tag_id)

    def can_see_audio_recording(self, recording):
        self._userapi.get_recording(recording.id_)

    def cannot_see_audio_recording(self, recording):
        for row in self._userapi.query_audio():
            assert row["id"] != recording.id_

    def cannot_see_any_audio_recordings(self):
        rows = self._userapi.query_audio()
        assert not rows

    def can_see_audio_recordings(self, recordings, **query_args):
        expected_ids = {rec.id_ for rec in recordings}
        actual_ids = {row["id"] for row in self._userapi.query_audio(**query_args)}
        assert actual_ids == expected_ids

    def update_audio_recording(self, recording, **updates):
        self._userapi.update_audio_recording(recording.id_, updates)

    def get_own_group(self):
        if self._group is None:
            self._group = self.create_group(self.username + "s_devices", False)
        return self._group

    def can_see_event_errors(self, device=None, startTime=None, endTime=None):
        deviceId = None
        if device is not None:
            deviceId = device.get_id()
        return self._userapi.query_event_errors(deviceId=deviceId, startTime=startTime, endTime=endTime)

    def can_see_events(self, device=None, startTime=None, endTime=None, type=None, limit=None, latest=None):
        deviceId = None
        if device is not None:
            deviceId = device.get_id()
        return self._userapi.query_events(
            deviceId=deviceId, startTime=startTime, endTime=endTime, type=type, limit=limit, latest=latest
        )

    def gets_first_event(self, type=None, limit=1, latest=None):
        events = self._userapi.query_events(type=type, limit=limit, latest=latest)
        assert len(events) == 1
        return events[0]["EventDetail"]

    def cannot_see_events(self):
        events = self._userapi.query_events()
        assert not events, "User '{}' can see events when it shouldn't".format(self.username)

    def get_device_id(self, devicename):
        return self._userapi.get_device_id(devicename)

    def get_devices_as_ids(self):
        return [device["id"] for device in self._userapi.get_devices_as_json()]

    def get_active_devices(self):
        devices = self._userapi.get_devices_as_json()
        active_devices = []
        for device in devices:
            if device["active"]:
                active_devices.append(device)
        return active_devices

    def query_devices(self, devices: List[TestDevice] = None, groups: List[str] = None, operator=None):
        return self._userapi.query_devices(devices=devices, groups=groups, operator=operator)

    def get_devices_as_string(self):
        return self._userapi.get_devices_as_string()

    def cannot_download_audio(self, recording):
        with pytest.raises(AuthorizationError):
            self._userapi.download_audio(recording.id_)

    def upload_audio_bait(self, details=None):
        if details is None:
            details = {"animal": "possum"}
        props = {"type": "audioBait", "details": details}
        filename = "files/small.cptv"
        file_id = self._userapi.upload_file(filename, props)
        return file_id

    def download_audio_bait(self, file_id):
        return self._userapi.download_file(file_id)

    def get_all_audio_baits(self):
        return AudioBaitList(self._userapi.query_files(where={"type": "audioBait"}))

    def delete_audio_bait_file(self, file_id):
        self._userapi.delete_file(file_id)

    def cannot_delete_audio_bait_file(self, file_id):
        with pytest.raises(AuthorizationError):
            self._userapi.delete_file(file_id)

    def set_audio_schedule_for(self, deviceIds, schedule):
        self._userapi.upload_schedule(deviceIds, schedule)

    def set_audio_schedule(self, schedule={"blah": "blah"}):
        return AudioSchedulePromise(self, schedule)

    def get_audio_schedule(self, device):
        print(f"device {device.devicename} has id {device.get_id()}")

        return self._userapi.get_audio_schedule(device.get_id())

    def uploads_recording_for(self, testdevice, device_id=None):
        props = testdevice.get_new_recording_props()

        filename = "files/small.cptv"
        if device_id:
            devicename = device_id
        else:
            devicename = testdevice.devicename

        recording_id = self._userapi.upload_recording_for(testdevice.group, devicename, filename, props)

        # Expect to see this in data returned by the API server.
        props["rawMimeType"] = "application/x-cptv"

        return Recording(recording_id, props, filename)

    def legacy_uploads_recording_for(self, testdevice):
        props = testdevice.get_new_recording_props()
        filename = "files/small.cptv"
        recording_id = self._userapi.legacy_upload_recording_for(testdevice.devicename, filename, props)

        # Expect to see this in data returned by the API server.
        props["rawMimeType"] = "application/x-cptv"

        return Recording(recording_id, props, filename)

    def record_event(self, device, type_, details, times=None):
        return self._userapi.record_event(device, type_, details, times)

    def set_global_permission(self, user, permission):
        self._userapi.set_global_permission(user, permission)

    def add_to_group(self, newuser, groupname):
        self._userapi.add_user_to_group(newuser, groupname)

    def add_to_group_as_group_admin(self, newuser, groupname):
        self._userapi.add_to_group_as_group_admin(newuser, groupname)

    def remove_from_group(self, olduser, groupname):
        self._userapi.remove_user_from_group(olduser, groupname)

    def add_stations_to_group(self, group_id_or_name, stations=None, fromDate=None):
        return self._userapi.add_stations_to_group(group_id_or_name, stations, fromDate)

    def get_stations_for_group(self, group_id_or_name):
        return self._userapi.get_stations_for_group(group_id_or_name)

    def add_to_device(self, newuser, device):
        self._userapi.add_user_to_device(newuser, device.get_id())

    def remove_from_device(self, olduser, device):
        self._userapi.remove_user_from_device(olduser, device.get_id())

    def device_has_device_users(self, device, *users):
        assert self._get_device_users(device, "device") == {u.username for u in users}

    def device_has_group_users(self, device, *users):
        assert self._get_device_users(device, "group") == {u.username for u in users}

    def _get_device_users(self, device, relation):
        users = self._userapi.list_device_users(device.get_id())
        return {u["username"] for u in users if u["relation"] == relation}

    def can_add_track_to_recording(self, recording, start_s=10):
        track = Track.create(recording, start_s)
        track.id_ = self._userapi.add_track(recording.id_, track.data)
        recording.tracks.append(track)
        return track

    def cannot_add_track_to_recording(self, recording):
        with pytest.raises(AuthorizationError):
            self.can_add_track_to_recording(recording)

    def has_no_tracks(self, recording):
        assert not self._userapi.get_tracks(recording.id_)

    def recording_has_tags(self, recording, ai_tag_count, human_tag_count):
        recording = self._userapi.get_recording(recording.id_)
        tags = recording.get("Tags", [])

        automatic_tags = [tag for tag in tags if tag["automatic"]]
        human_tags = [tag for tag in tags if not tag["automatic"]]
        assert ai_tag_count == len(automatic_tags)
        assert human_tag_count == len(human_tags)

    def can_see_track(self, expected_track):
        recording = expected_track.recording
        tracks = self._userapi.get_tracks(recording.id_)

        for t in tracks:
            this_track = Track(id_=t["id"], recording=recording, data=t["data"])
            this_track.tags = [
                TrackTag(
                    id_=tt["id"],
                    track=this_track,
                    what=tt["what"],
                    confidence=tt["confidence"],
                    automatic=tt["automatic"],
                    data=tt["data"],
                )
                for tt in t["TrackTags"]
            ]
            this_track.tags = sorted(this_track.tags, key=lambda tag: tag.id_ if tag.id_ else -1)

            if this_track == expected_track:
                return

        pytest.fail("no such track found: {}".format(expected_track))

    def cannot_see_track(self, target):
        tracks = self._userapi.get_tracks(target.recording.id_)
        for t in tracks:
            if Track(target.recording, t["data"], t["id"]) == target:
                pytest.fail("track not deleted: {}".format(target))

    def delete_track(self, track):
        self._userapi.delete_track(track.recording.id_, track.id_)

    def cannot_delete_track(self, track):
        with pytest.raises(AuthorizationError):
            self._userapi.delete_track(track.recording.id_, track.id_)

    def tag_track(self, track, what):
        self._tag_track_as(track, what, False)

    def tag_track_as_unauthorised_user(self, recording_id, track_id, what, tag_jwt):
        return self._userapi.add_track_tag(
            recording_id=recording_id,
            track_id=track_id,
            what=what,
            confidence=0.7,
            automatic=False,
            data={},
            tag_jwt=tag_jwt,
        )

    def delete_track_tag_as_unauthorised_user(self, recording_id, track_id, track_tag_id, tag_jwt):
        self._userapi.delete_track_tag(
            recording_id=recording_id, track_id=track_id, track_tag_id=track_tag_id, tag_jwt=tag_jwt
        )

    def tag_track_as_AI(self, track, what):
        self._tag_track_as(track, what, True)

    def _tag_track_as(self, track, what, automatic):
        self._userapi.add_track_tag(
            recording_id=track.recording.id_,
            track_id=track.id_,
            what=what,
            confidence=0.7,
            automatic=automatic,
            data={},
        )

    def can_tag_track(self, track, automatic=None, what=None, replace=False, ai_name=None):
        tag = TrackTag.create(track, automatic=automatic, what=what, ai_name=ai_name)
        tag.id_ = self._userapi.add_track_tag(
            recording_id=track.recording.id_,
            track_id=track.id_,
            what=tag.what,
            confidence=tag.confidence,
            automatic=tag.automatic,
            data=tag.data,
            replace=replace,
        )
        track.tags.append(tag)
        track.tags = sorted(track.tags, key=lambda tag: tag.id_ if tag.id_ else -1)
        return tag

    def cannot_tag_track(self, track):
        with pytest.raises(AuthorizationError):
            self.can_tag_track(track)

    def can_delete_track_tag(self, tag):
        self._userapi.delete_track_tag(
            recording_id=tag.track.recording.id_, track_id=tag.track.id_, track_tag_id=tag.id_
        )
        tag.track.tags.remove(tag)

    def cannot_delete_track_tag(self, tag):
        with pytest.raises(AuthorizationError):
            self.can_delete_track_tag(tag)

    def get_tracks(self, recording_id):
        return self._userapi.get_tracks(recording_id)

    def get_cacophony_index_for_device(self, device: TestDevice, from_time=None, window_size=None):
        return self._userapi.get_cacophony_index(device.get_id(), from_time, window_size)

    def get_cacophony_index_histogram_for_device(self, device: TestDevice, from_time=None, window_size=None):
        return self._userapi.get_cacophony_index_histogram(device.get_id(), from_time, window_size)

    def create_alert(self, name, conditions, device_id, frequency=None):
        return self._userapi.create_alert(name, conditions, device_id, frequency)

    def get_alerts(self, device_id):
        return self._userapi.get_alerts(device_id)

    def admin_login_as_other_user(self, username):
        return self._userapi.admin_login_as_other_user(username)

    def list_users(self):
        return self._userapi.list_users()


class RecordingQueryPromise:
    def __init__(self, testUser):
        self._testUser = testUser
        self._queryParams = {}
        self._expected_recordings = None

    def tagmode(self, tagmode):
        self._queryParams["tagmode"] = tagmode
        return self

    def tags(self, tags):
        self._queryParams["tags"] = tags
        return self

    def devices(self, devices):
        self._queryParams["deviceIds"] = list(map(lambda device: device.get_id(), devices))
        return self

    def can_see_recordings(self, *expected_recordings):
        self._testUser._can_see_recordings_with_query(self._queryParams, *expected_recordings)

    def cannot_see_recordings(self, *expected_recordings):
        self._testUser._cannot_see_recordings_with_query(self._queryParams, *expected_recordings)

    def can_see_all_recordings_from_(self, allRecordings):
        self.can_see_recordings(*allRecordings)

    # Expects the function 'from_' to be called to do the evaluating.
    def can_only_see_recordings(self, *expected_recordings):
        self._expected_recordings = expected_recordings
        return self

    def from_(self, allRecordings):
        if not self._expected_recordings:
            raise TestException(
                "You must call 'can_only_see_recordings' before calling function 'from_list'."
            )

        ids = [testRecording.id_ for testRecording in self._expected_recordings]
        print("Then searching with {} should give only {}.".format(self._queryParams, ids))

        # test what should be there, is there
        self.can_see_recordings(*self._expected_recordings)

        # test what shouldn't be there, isn't there
        expectedMissingRecordings = [x for x in allRecordings if x not in self._expected_recordings]
        self.cannot_see_recordings(*expectedMissingRecordings)


class AudioSchedulePromise:
    def __init__(self, testUser, schedule):
        self._testUser = testUser
        self._schedule = schedule

    def for_device(self, device):
        self.for_devices(device)

    def for_devices(self, *devices):
        deviceIds = list(map(lambda device: device.get_id(), devices))

        self._testUser.set_audio_schedule_for(deviceIds, self._schedule)


class AudioBaitList:
    def __init__(self, all_bait_files):
        self._all_bait_files = all_bait_files

    def get_info_for(self, audio_bait_id):
        if not self._all_bait_files:
            return None
        for bait in self._all_bait_files:
            if bait["id"] == audio_bait_id:
                return bait
        return None


def assertDateTimeStrings(left, right):
    assert left[:23] == right[:23]


def assert_props_exist(props, recv_props):
    for key in props:
        if isinstance(props[key], dict):
            assert key in recv_props
            assert_props_exist(props[key], recv_props[key])
        else:
            assert key in recv_props
            assert props[key] == recv_props[key]
