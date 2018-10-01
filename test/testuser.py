import io
import pytest

from .testexception import TestException
from .testrecording import TestRecording

class TestUser:
    def __init__(self, username, userapi, email = None):
        self._userapi = userapi
        self.username = username
        self.email = email
        self._group = None

    def when_searching_with(self, queryParams):
        return RecordingQueryPromise(self, queryParams)

    def when_searching_with_tagmode(self, tagmode):
        queryParams = {"tagmode": tagmode}
        return RecordingQueryPromise(self, queryParams)

    def when_searching_for_tags(self, *tags):
        queryParams = {"tags": tags}
        return RecordingQueryPromise(self, queryParams)

    def get_recording(self, recording_id, params=None):
        return self._userapi.get_recording(recording_id, params)

    def query_recordings(self, **options):
        return self._userapi.query(**options)

    def can_see_recordings(self, *expectedTestRecordings):
        self._can_see_recordings_with_query({}, *expectedTestRecordings)

    def _can_see_recordings_with_query(self, queryParams,
                                       *expectedTestRecordings):
        recordings = self._userapi.query(**queryParams)
        if not recordings:
            raise TestException(
                "User '{}' could not see any recordings.".format(
                    self.username))

        _errors = []
        for testRecording in expectedTestRecordings:
            if not self._recording_in_list(recordings, testRecording):
                _errors.append(
                    "User '{}' cannot see recording with id {}.".format(
                        self.username, testRecording.recordingId))

        if _errors:
            raise TestException(_errors)

    def cannot_see_recordings(self, *expectedTestRecordings):
        self._cannot_see_recordings_with_query({}, *expectedTestRecordings)

    def _cannot_see_recordings_with_query(self, queryParams,
                                          *expectedTestRecordings):
        recordings = self._userapi.query(**queryParams)

        _errors = []
        for testRecording in expectedTestRecordings:
            if self._recording_in_list(recordings, testRecording):
                _errors.append(
                    "User '{}' can see recording with id {}, but shouldn't be able to..".
                    format(self.username, testRecording.recordingId))

        if _errors:
            raise TestException(_errors)

    def _recording_in_list(self, recordings, testRecording):
        for recording in recordings:
            if recording['id'] == testRecording.recordingId:
                return True
        return False

    def can_see_recording_from(self, testdevice):
        recordings = self._userapi.query(limit=1)
        assert recordings, \
            "User '{}' could not see any recordings.".format(self.username)

        lastDevice = recordings[0]['Device']['devicename']
        assert lastDevice == testdevice.devicename, \
            "Latest recording is from device '{}', not from '{}'".format(lastDevice, testdevice.devicename)

    def cannot_see_any_recordings(self):
        recordings = self._userapi.query(limit=10)
        if recordings:
            raise TestException(
                "User '{}' can see a recording from '{}'".format(
                    self.username, recordings[0]['Device']['devicename']))

    def can_download_correct_recording(self, recording):
        content = io.BytesIO()
        for chunk in self._userapi.download_cptv(recording.recordingId):
            content.write(chunk)
        assert content.getvalue() == recording.content

        recv_props = self._userapi.get_recording(recording.recordingId)

        props = recording.props.copy()

        if 'relativeToDawn' not in props:
            props['relativeToDawn'] = None
        if 'relativeToDusk' not in props:
            props['relativeToDusk'] = None

        # # These are expected to be there but the values aren't tested.
        del recv_props['Device']
        del recv_props['Tags']
        del recv_props['GroupId']
        del recv_props['location']
        del recv_props['rawFileKey']
        del recv_props['rawFileSize']
        if 'rawMimeType' not in props:
            del recv_props['rawMimeType']
        del recv_props['fileKey']
        del recv_props['fileSize']
        del recv_props['fileMimeType']
        if 'type' not in props:
            recv_props.pop('type', None)
        if 'comment' not in props:
            recv_props.pop('comment', None)
        if 'recordingTime' not in recv_props:
            props.pop('recordingTime', None)

        assert recv_props.pop('id') == recording.recordingId
        assert recv_props.pop('processingState') != 'FINISHED'

        # # Time formatting may differ so these are handled specially.
        assertDateTimeStrings(
            recv_props.pop('recordingDateTime'),
            props.pop('recordingDateTime'),
        )

        # Compare the remaining properties.
        assert recv_props == props

    def delete_recording(self, recording):
        self._userapi.delete_recording(recording.recordingId)

    def update_recording(self, recording, **updates):
        self._userapi.update_recording(recording.recordingId, updates)

    def create_group(self, groupname, printname=True):
        try:
            self._userapi.create_group(groupname)
        except Exception as exception:
            raise TestException(
                "Failed to create group ({}) {}.  If error is 'group name in use', your super-user needs admin rights".
                format(groupname, exception))
        if (printname):
            print("({})".format(groupname))
        return groupname

    def get_user_details(self, user):
        self._userapi.get_user_details(user.username)

    def tag_recording(self, recordingId, tagDictionary):
        self._userapi.tag_recording(recordingId, tagDictionary)

    def can_see_audio_recording(self, recording):
        self._userapi.get_audio(recording.recordingId)

    def cannot_see_audio_recording(self, recording):
        for row in self._userapi.query_audio():
            assert row['id'] != recording.recordingId

    def cannot_see_any_audio_recordings(self):
        rows = self._userapi.query_audio()
        assert not rows

    def can_see_audio_recordings(self, recordings, **query_args):
        expected_ids = {rec.recordingId for rec in recordings}
        actual_ids = {row['id'] for row in self._userapi.query_audio(**query_args)}
        assert actual_ids == expected_ids

    def delete_audio_recording(self, recording):
        self._userapi.delete_audio(recording.recordingId)

    def update_audio_recording(self, recording, **updates):
        self._userapi.update_audio_recording(recording.recordingId, updates)

    def get_own_group(self):
        if (self._group is None):
            self._group = self.create_group(self.username + "s_devices", False)
        return self._group

    def can_see_events(self, device=None):
        deviceId = None
        if (device is not None):
            deviceId = device.get_id()
        return self._userapi.query_events(limit=10, deviceId=deviceId)

    def cannot_see_events(self):
        events = self._userapi.query_events(limit=10)
        if events:
            raise TestException(
                "User '{}' can see a events from '{}'".format(
                    self.username, recordings[0]['DeviceId']))

    def get_device_id(self, devicename):
        return self._userapi.get_device_id(devicename)

    def cannot_download_audio(self, recording):
        with pytest.raises(IOError):
            self._userapi.download_audio(recording.recordingId)

    def upload_audio_bait(self, details={"animal": "possum"}):
        props = {
            "type": "audioBait",
            "details": details
        }
        filename = 'files/small.cptv'
        recording_id = self._userapi.upload_file(filename, props)
        return recording_id

    def download_audio_bait(self, file_id):
        return self._userapi.download_file(file_id)

    def get_all_audio_baits(self):
        return AudioBaitList(self._userapi.query_files('{"type":"audioBait"}'))

    def delete_audio_bait_file(self, file_id):
        self._userapi.delete_file(file_id)

    def cannot_delete_audio_bait_file(self, file_id):
        self._userapi.delete_file(file_id)

    def set_audio_schedule_for(self, deviceIds, schedule):
        self._userapi.upload_schedule(deviceIds, schedule)

    def set_audio_schedule(self, schedule={"blah" : "blah"}):
        return AudioSchedulePromise(self, schedule)

    def get_audio_schedule(self, device):
        return self._userapi.get_audio_schedule(device.devicename)

    def uploads_recording_for(self, testdevice):
        props = testdevice.get_new_recording_props()

        filename = 'files/small.cptv'
        recording_id = self._userapi.upload_recording_for(testdevice.devicename, filename, props)

        # Expect to see this in data returned by the API server.
        props['rawMimeType'] = 'application/x-cptv'

        return TestRecording(recording_id, props, filename)

    def set_global_permission(self, user, permission):
        self._userapi.set_global_permission(user, permission)

class RecordingQueryPromise:
    def __init__(self, testUser, queryParams):
        self._testUser = testUser
        self._queryParams = queryParams
        self._expectedTestRecordings = None

    def can_see_recordings(self, *expectedTestRecordings):
        self._testUser._can_see_recordings_with_query(self._queryParams,
                                                      *expectedTestRecordings)

    def cannot_see_recordings(self, *expectedTestRecordings):
        self._testUser._cannot_see_recordings_with_query(
            self._queryParams, *expectedTestRecordings)

    def can_see_all_recordings_from_(self, allRecordings):
        self.can_see_recordings(*allRecordings)

    def can_only_see_recordings(self, *expectedTestRecordings):
        self._expectedTestRecordings = expectedTestRecordings
        return self

    def from_(self, allRecordings):
        if not self._expectedTestRecordings:
            raise TestException(
                "You must call 'can_only_see_recordings' before calling function 'from_list'."
            )

        ids = [
            testRecording.recordingId
            for testRecording in self._expectedTestRecordings
        ]
        print("Then searching with {} should give only {}.".format(
            self._queryParams, ids))

        # test what should be there, is there
        self.can_see_recordings(*self._expectedTestRecordings)

        #test what shouldn't be there, isn't there
        expectedMissingRecordings = [
            x for x in allRecordings if x not in self._expectedTestRecordings
        ]
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
            if bait['id'] == audio_bait_id:
                return bait
        return None


def assertDateTimeStrings(left, right):
    assert left[:23] == right[:23]
