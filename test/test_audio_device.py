class TestAudioDevice:
    def test_can_upload_audio(self, helper):
        description = "If a new device 'Listener' signs up"
        listener = helper.given_new_device(self, "Listener", description=description)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(listener.devicename, helper.config.default_group)

        print("And 'Listener' should be able to upload an audio file")
        recording = listener.upload_audio_recording()

        user = helper.admin_user()

        print("And the audio recording can be downloaded by a user")
        user.can_download_correct_recording(recording)

    def test_can_only_set_user_settable_fields(self, helper):
        UNSETTABLE_FIELD = "GroupId"
        UNSETTABLE_INPUT_VALUE = "test_value"

        description = "If a new device 'Listener' signs up"
        listener = helper.given_new_device(self, "Listener", description=description)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(listener.devicename)

        print("And 'Listener' should be able to upload an audio file even with disallowed metadata")
        recording = listener.upload_audio_recording({UNSETTABLE_FIELD: UNSETTABLE_INPUT_VALUE})

        user = helper.admin_user()

        print("But when a user gets the metadata")
        metadata = user.get_recording(recording)

        print("It should not include the unsettable field")
        assert metadata[UNSETTABLE_FIELD] != UNSETTABLE_INPUT_VALUE
