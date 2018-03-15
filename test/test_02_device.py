import pytest
from fixturetestapi import FixtureTestAPI


class TestUser:

    def test_device_can_register(self):
        testapi = FixtureTestAPI()

        print("If a new device 'The Destroyer' signs up", end='')
        destroyer = testapi.given_new_device(self, 'The Destroyer')
        
        print("Then 'The Destroyer' should able to log in")
        the_destroyer = testapi.login_as_device(destroyer.devicename)

        print("And 'The Destroyer' should be able to upload a CPTV file")
        the_destroyer.upload_recording()

        print("And the CPTV file should be visible to super users on the site")
        testapi.admin_user().can_see_recording_from(the_destroyer)
       





    