from testexception import TestException


class TestUser:
    def __init__(self, username, userapi):
        self._userapi = userapi
        self.username = username

    def can_see_audio_recording_from_group(self, groupName):
        recordings = self._userapi.query_audio(limit=1)
        assert recordings, \
            "User '{}' could not see any recordings.".format(self.username)

        lastGroup = recordings[0]['group']
        assert lastGroup == groupName, \
            "Latest audio recording is from group '{}', not from '{}'".format(lastGroup, groupName)

    def can_see_recording_from(self, testdevice):
        recordings = self._userapi.query(limit=1)
        assert recordings, \
            "User '{}' could not see any recordings.".format(self.username)

        lastDevice = recordings[0]['Device']['devicename']
        assert lastDevice == testdevice.devicename, \
            "Latest recording is from device '{}', not from '{}'".format(lastDevice, testdevice.devicename)

    def cannot_see_any_recordings(self):
        recordings = self._userapi.query(limit=1)
        assert not recordings, \
            "User '{}' can see a recording from '{}'".format(self.username, recordings[0]['Device']['devicename'])

    def create_group(self, groupname):
        self._userapi.create_group(groupname)

    def get_user_details(self, user):
        self._userapi.get_user_details(user.username)
