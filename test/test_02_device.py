from helper import Helper


class TestDevice:
    def test_device_can_upload_cptv(self):
        helper = Helper()

        groupName = helper.make_unique_group_name(self, 'ThermalDevice')
        helper.admin_user().create_group(groupName)

        print("If a new device 'Destroyer' signs up", end='')
        destroyer = helper.given_new_device(self, 'Destroyer', groupName)

        print("Then 'Destroyer' should able to log in")
        helper.login_as_device(destroyer.devicename)

        print("And 'Destroyer' should be able to upload a CPTV file")
        destroyer.upload_recording()

        print("And the CPTV file should be visible to super users")
        helper.admin_user().can_see_recording_from(destroyer)

    def test_device_can_upload_audio(self):
        helper = Helper()

        groupName = helper.make_unique_group_name(self, 'AudioDevice')
        helper.admin_user().create_group(groupName)

        print("If a new device 'Listener' signs up", end='')
        listener = helper.given_new_device(self, 'Listener', groupName)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(listener.devicename)

        print("And 'Listener' should be able to upload an audio file")
        print(listener.upload_audio_recording())

        print("And the CPTV file should be visible to super users")
        helper.admin_user().can_see_audio_recording_from_group(groupName)
