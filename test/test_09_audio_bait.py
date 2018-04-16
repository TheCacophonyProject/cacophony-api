class TestBait:
    def test_anyone_or_device_can_download_file(self, helper):
        print("If a user Grant uploads an audio file")
        audio_bait = helper.given_new_user(self, 'grant').upload_audio_bait()

        print("Then his friend Howard should be able to down load it")
        helper.given_new_user(self, 'howard').download_audio_bait(audio_bait)

        print("And a device should be able to download the file")
        helper.given_new_device(self, 'possum-gone-ator', description="").download_audio_bait(audio_bait)