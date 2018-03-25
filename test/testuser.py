from testexception import TestException

class TestUser:

    def __init__(self, username, userapi):
        self._userapi = userapi
        self.username = username

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

    def _can_see_recordings_with_query(self, queryParams, *expectedTestRecordings):
        recordings = self._userapi.query(**queryParams)
        if not recordings:
            raise TestException("User '{}' could not see any recordings.".format(self.username))

        _errors = []
        for testRecording in expectedTestRecordings:
            if not self._recording_in_list(recordings, testRecording):
                _errors.append("User '{}' cannot see recording with id {}.".format(self.username, testRecording.recordingId))

        if _errors:
            raise TestException(_errors)


    def cannot_see_recordings(self, *expectedTestRecordings):
        self._can_see_recordings_with_query({}, *expectedTestRecordings)

    def _cannot_see_recordings_with_query(self, queryParams, *expectedTestRecordings):
        recordings = self._userapi.query(**queryParams)

        _errors = []
        for testRecording in expectedTestRecordings:
            if self._recording_in_list(recordings, testRecording):
                _errors.append("User '{}' can see recording with id {}, but shouldn't be able to..".format(self.username, testRecording.recordingId))

        if _errors:
            raise TestException(_errors)


    def _recording_in_list(self, recordings, testRecording):
        for recording in recordings:
            if recording['id'] == testRecording.recordingId:
                return True

        return False


    def cannot_see_any_recordings(self):
        recordings = self._userapi.query(limit=10)
        if recordings:
            raise TestException("User '{}' can see a recording from '{}'".format(self.username, recordings[0]['Device']['devicename']))


    def create_group(self, groupname):
        try:
            self._userapi.create_group(groupname)
        except Exception as exception:
            raise TestException("Failed to create group ({}) {}.  If error is 'group name in use', your super-user needs admin rights".format(groupname, exception))


    def get_user_details(self, user):
        self._userapi.get_user_details(user.username)

    def get_user_details(self, user):
        self._userapi.get_user_details(user.username)

    def tag_recording(self, recordingId, tagDictionary):
        self._userapi.tag_recording(recordingId, tagDictionary)


class RecordingQueryPromise:
    def __init__(self, testUser, queryParams):
        self._testUser = testUser
        self._queryParams = queryParams
        self._expectedTestRecordings = None

    def can_see_recordings(self, *expectedTestRecordings):
        self._testUser._can_see_recordings_with_query(self._queryParams, *expectedTestRecordings)

    def cannot_see_recordings(self, *expectedTestRecordings):
        self._testUser._cannot_see_recordings_with_query(self._queryParams, *expectedTestRecordings)

    def can_see_all_recordings_from_(self, allRecordings):
        self.can_see_recordings(*allRecordings)

    def can_only_see_recordings(self, *expectedTestRecordings):
        self._expectedTestRecordings = expectedTestRecordings
        return self

    def from_(self, allRecordings):
        if not self._expectedTestRecordings:
            raise TestException("You must call 'can_only_see_recordings' before calling function 'from_list'.")

        ids = [testRecording.recordingId for testRecording in self._expectedTestRecordings]
        print("Then searching with {} should give only {}.".format(self._queryParams, ids))

        # test what should be there, is there
        self.can_see_recordings(*self._expectedTestRecordings)

        #test what shouldn't be there, isn't there
        expectedMissingRecordings = [x for x in allRecordings if x not in self._expectedTestRecordings]
        self.cannot_see_recordings(*expectedMissingRecordings)
