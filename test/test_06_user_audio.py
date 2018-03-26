class TestUserAudio:
    def test_can_delete_audio(self, helper):
        phone = helper.given_new_device(self, 'phone')
        recording = phone.has_audio_recording()

        print("\nA user should be able to see the audio recording")
        user = helper.admin_user()
        user.can_see_audio_recording(recording)

        print("And when they delete it ... ", end='')
        user.delete_audio_recording(recording)

        print("they can no longer see it.")
        user.cannot_see_audio_recording(recording)

    def test_can_download_audio(self, helper):
        phone = helper.given_new_device(self, 'phone')
        recording = phone.has_audio_recording()

        print("\nA user should be able to download the audio recording")
        user = helper.admin_user()
        user.can_download_correct_audio_recording(recording)
