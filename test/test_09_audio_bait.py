class TestBait:
    def test_can_upload_audio_file(self, helper):
        print("If a user Grant uploads an audio file")
        audio_bait = helper.given_new_user(self, 'grant').upload_audio_bait()

        # print("Then his friend Howard should be able to down load it)
        # helper.given_new_user(self, 'howard').dowload_audio_bait(audio_bait)