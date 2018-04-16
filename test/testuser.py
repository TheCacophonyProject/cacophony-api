import io

import pytest

from .testexception import TestException

class TestUser:
    def __init__(self, username, userapi):
        self._userapi = userapi
        self.username = username
        self._group = None

    def when_searching_with(self, queryParams):
        return RecordingQueryPromise(self, queryParams)

    def when_searching_with_tagmode(self, tagmode):
        queryParams = {"tagmode": tagmode}
        return RecordingQueryPromise(self, queryParams)

    def when_searching_for_tags(self, *tags):
        queryParams = {"tags": tags}
        return RecordingQueryPromise(self, queryParams)

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

        # # These are expected to be there but the values aren't tested.
        del recv_props['Device']
        del recv_props['Tags']
        del recv_props['GroupId']
        del recv_props['location']
        del recv_props['fileKey']
        del recv_props['rawFileKey']
        del recv_props['rawFileSize']
        del recv_props['fileMimeType']
        del recv_props['fileSize']

        assert recv_props.pop('id') == recording.recordingId
        assert recv_props.pop('processingState') == 'toMp4'

        # # Time formatting may differ so these are handled specially.
        assertDateTimeStrings(
            recv_props.pop('recordingDateTime'),
            props.pop('recordingDateTime'),
        )

        # Compare the remaining properties.
        assert recv_props == props

    def delete_recording(self, recording):
        self._userapi.delete_recording(recording.recordingId)

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
        with pytest.raises(IOError, match=r'.*No file found with given datapoint.'):
            self._userapi.get_audio(recording.recordingId)

    def cannot_see_any_audio_recordings(self):
        rows = self._userapi.query_audio()
        assert not rows

    def can_see_audio_recordings(self, recordings):
        expected_ids = {rec.recordingId for rec in recordings}
        actual_ids = {row['id'] for row in self._userapi.query_audio()}
        assert actual_ids == expected_ids

    def delete_audio_recording(self, recording):
        self._userapi.delete_audio(recording.recordingId)

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

    def can_download_correct_audio_recording(self, recording):
        content = io.BytesIO()
        for chunk in self._userapi.download_audio(recording.recordingId):
            content.write(chunk)
        assert content.getvalue() == recording.content

        # For audio recordings there's no way to get audio metadata
        # directly so the query API must be used.
        for row in self._userapi.query_audio(limit=10):
            if row['id'] == recording.recordingId:
                props = recording.props.copy()

                # These are expected to be there but the values aren't tested.
                del row['id']
                del row['groupId']
                del row['group']
                del row['deviceId']
                del row['location']
                del row['fileKey']

                # Time formatting may differ so these are handled specially.
                assertDateTimeStrings(
                    row.pop('recordingDateTime'),
                    props.pop('recordingDateTime'),
                )

                # Tags have never been used for audio recordings.
                assert row.pop('tags') == []

                # Compare the remaining properties.
                assert row == props
                return

        # Shouldn't happen
        raise ValueError("audio recording not found in query result")

    def upload_audio_bait(self):
        props = {
            "type": "audioBait",
            "details": '{"animal":"possum"}',
        }
        filename = 'files/small.cptv'
        recording_id = self._userapi.upload_file(filename, props)
        return recording_id

    def download_audio_bait(self, file_id):
        return self._userapi.download_file(file_id)


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


def assertDateTimeStrings(left, right):
    assert left[:23] == right[:23]
