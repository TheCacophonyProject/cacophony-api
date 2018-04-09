class TestAudioDevice:
    def test_can_upload_audio(self, helper):
        description = "If a new device 'Listener' signs up"
        listener = helper.given_new_device(self, 'Listener', description=description)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(listener.devicename)

        print("And 'Listener' should be able to upload an audio file")
        recording = listener.upload_audio_recording()

        print("And the audio recording can be downloaded by the super user")
        helper.admin_user().can_download_correct_audio_recording(recording)
