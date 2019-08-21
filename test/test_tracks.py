class TestTracks:
    def test_can_add_and_delete_tracks(self, helper):
        recording = helper.given_new_device(self, "tracks").has_recording()

        user = helper.admin_user()
        track0 = user.can_add_track_to_recording(recording)
        user.can_see_track(track0)

        track1 = user.can_add_track_to_recording(recording)
        user.can_see_track(track1)

        user.delete_track(track0)
        user.cannot_see_track(track0)
        user.can_see_track(track1)

    def test_cant_add_track_to_other_users_recording(self, helper):
        recording = helper.given_new_device(self, "tracks").has_recording()

        random_user = helper.given_new_user(self, "random")
        random_user.cannot_add_track_to_recording(recording)

    def test_cant_delete_other_users_track(self, helper):
        recording = helper.given_new_device(self, "tracks").has_recording()
        owner = helper.admin_user()
        track = owner.can_add_track_to_recording(recording)

        random_user = helper.given_new_user(self, "random")
        random_user.cannot_delete_track(track)

    def test_track_tags(self, helper):
        recording = helper.given_new_device(self, "tracks").has_recording()

        user = helper.admin_user()
        track = user.can_add_track_to_recording(recording)

        # Add a track tag and ensure the user can see it.
        user.can_tag_track(track)
        user.can_see_track(track)

        # Add another track tag and ensure the user can see that too.
        tag = user.can_tag_track(track)
        user.can_see_track(track)

        user.can_delete_track_tag(tag)
        user.can_see_track(track)

    def test_cant_add_track_tag_to_other_users_recording(self, helper):
        recording = helper.given_new_device(self, "tracks").has_recording()
        owner = helper.admin_user()
        track = owner.can_add_track_to_recording(recording)

        random_user = helper.given_new_user(self, "random")
        random_user.cannot_tag_track(track)

    def test_cant_delete_other_users_tag_track(self, helper):
        recording = helper.given_new_device(self, "tracks").has_recording()
        owner = helper.admin_user()
        track = owner.can_add_track_to_recording(recording)
        tag = owner.can_tag_track(track)

        random_user = helper.given_new_user(self, "random")
        random_user.cannot_delete_track_tag(tag)
