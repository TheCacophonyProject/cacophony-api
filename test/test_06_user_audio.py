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
        user.can_download_correct_recording(recording)

    def test_can_query_audio_recordings(self, helper):
        print("If a new user clare", end='')
        clare = helper.given_new_user(self, 'clare')

        print("   has a new group called 'area51'", end='')
        group_name = helper.make_unique_group_name(self, 'area51')
        clare.create_group(group_name)
        print("({})".format(group_name))

        description = "  and there is a new device called 'Bob' in this group"
        device = helper.given_new_device(self, 'Bob', group_name, description=description)

        print("There should be no recordings initially")
        clare.cannot_see_any_audio_recordings()

        print("When recordings are uploaded")
        recordings = []
        for _ in range(5):
            recordings.append(device.has_audio_recording())
            print()

        print("Clare should be able to see exactly those the recordings")
        clare.can_see_audio_recordings(recordings)


    def test_can_update_audio(self, helper):
        phone = helper.given_new_device(self, 'phone')
        recording = phone.has_audio_recording()

        print("\nWhen a user updates the audio recording")
        user = helper.admin_user()
        meta = recording['additionalMetadata']
        meta['foo'] = 'bar'
        print(meta)
        user.update_audio_recording(recording, additionalMetadata=meta)

        print("the change should be reflected on the API server")
        print(recording['additionalMetadata'])
        user.can_download_correct_recording(recording)
