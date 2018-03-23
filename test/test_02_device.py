from helper import Helper


class TestDevice:
    def test_device_can_upload_cptv(self):
        helper = Helper()

        description = "If a new device 'Destroyer' signs up"
        destroyer = helper.given_new_device(self, 'Destroyer', description=description)

        print("Then 'Destroyer' should able to log in")
        helper.login_as_device(destroyer.devicename)

        print("And 'Destroyer' should be able to upload a CPTV file")
        destroyer.upload_recording()

        print("And the CPTV file should be visible to super users")
        helper.admin_user().can_see_recording_from(destroyer)

    def test_device_can_upload_audio(self):
        helper = Helper()

        description = "If a new device 'Listener' signs up"
        listener = helper.given_new_device(self, 'Listener', description=description)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(listener.devicename)

        print("And 'Listener' should be able to upload an audio file")
        recording = listener.upload_audio_recording()

        print("And the CPTV file should be visible to super users")
        helper.admin_user().can_see_audio_recording(recording.recordingId)
