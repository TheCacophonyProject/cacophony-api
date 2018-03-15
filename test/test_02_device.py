import pytest
from helper import Helper

class TestUser:

    def test_device_can_register(self):
        helper = Helper()

        print("If a new device 'The Destroyer' signs up", end='')
        destroyer = helper.given_new_device(self, 'The Destroyer')
        
        print("Then 'The Destroyer' should able to log in")
        the_destroyer = helper.login_as_device(destroyer.devicename)

        print("And 'The Destroyer' should be able to upload a CPTV file")
        the_destroyer.upload_recording()

        print("And the CPTV file should be visible to super users on the site")
        helper.admin_user().can_see_recording_from(the_destroyer)
       





    