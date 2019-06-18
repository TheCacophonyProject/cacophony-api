class TestAudioDevice:
    def test_can_upload_audio(self, helper):
        description = "If a new device 'Listener' signs up"
        listener = helper.given_new_device(
            self, "Listener", description=description)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(listener.devicename,
                               helper.config.default_group)

        print("And 'Listener' should be able to upload an audio file")
        recording = listener.upload_audio_recording()

        user = helper.admin_user()

        print("And the audio recording can be downloaded by a user")
        user.can_download_correct_recording(recording)
