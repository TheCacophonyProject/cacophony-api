from testexception import TestException

class TestUser:

    def __init__(self, username, userapi):
        self._userapi = userapi
        self.username = username


    def can_see_recording_from(self, testdevice):
        recordings = self._userapi.query(limit=1)
        if not recordings:
            raise TestException("User '{}' could not see any recordings.".format(self.username))

        lastDevice = recordings[0]['Device']['devicename']
        if (lastDevice != testdevice.devicename):
            raise TestException("Lastest recording was not from device '{}', not from '{}'".format(lastDevice, testdevice.devicename))
            
    def cannot_see_any_recordings(self):
        recordings = self._userapi.query(limit=1)
        if recordings:
            raise TestException("User '{}' can see a recording from '{}'".format(self.username, recordings[0]['Device']['devicename']))
        

    def create_group(self, groupname):
        self._userapi.create_group(groupname)

    def get_user_details(self, user):
        self._userapi.get_user_details(user.username)
        