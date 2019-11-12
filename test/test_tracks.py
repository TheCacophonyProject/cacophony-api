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

    def test_replace_tags(self, helper):
        admin_user = helper.admin_user()
        sharer = helper.given_new_device(self, "Sharer")
        sylvia = helper.given_new_user(self, "Sylvia")
        admin_user.add_to_device(sylvia, sharer)
        recording = sharer.has_recording()
        track = admin_user.can_add_track_to_recording(recording)

        admin_user.can_tag_track(track, automatic=True, what="Possum", replace=True)
        self.track_tag_is(sylvia, recording.id_, ["Possum"], [])

        sylvia.can_tag_track(track, automatic=False, what="Cat", replace=True)
        self.track_tag_is(sylvia, recording.id_, ["Possum"], ["Cat"])

        sylvia.can_tag_track(track, automatic=False, what="Rodent", replace=True)
        self.track_tag_is(sylvia, recording.id_, ["Possum"], ["Rodent"])

        admin_user.can_tag_track(track, automatic=False, what="Cat", replace=True)
        self.track_tag_is(sylvia, recording.id_, ["Possum"], ["Cat", "Rodent"])

        admin_user.can_tag_track(track, automatic=False, what="Part", replace=True)
        self.track_tag_is(sylvia, recording.id_, ["Possum"], ["Cat", "Rodent", "Part"])

        admin_user.can_tag_track(track, automatic=False, what="Part", replace=True)
        self.track_tag_is(sylvia, recording.id_, ["Possum"], ["Cat", "Rodent", "Part"])

        sylvia.can_tag_track(track, automatic=False, what="Part", replace=True)
        self.track_tag_is(sylvia, recording.id_, ["Possum"], ["Cat", "Rodent", "Part", "Part"])

        sylvia.can_tag_track(track, automatic=False, what="Poor Tracking", replace=True)
        self.track_tag_is(
            sylvia, recording.id_, ["Possum"], ["Cat", "Rodent", "Part", "Part", "Poor Tracking"]
        )

        sylvia.can_tag_track(track, automatic=False, what="Mustelid", replace=True)
        self.track_tag_is(
            sylvia, recording.id_, ["Possum"], ["Cat", "Mustelid", "Part", "Part", "Poor Tracking"]
        )

        admin_user.can_tag_track(track, automatic=True, what="Rat", replace=True)
        self.track_tag_is(
            sylvia, recording.id_, ["Rat"], ["Cat", "Mustelid", "Part", "Part", "Poor Tracking"]
        )

    def track_tag_is(self, user, recording_id, ai_tag, manual_tags):
        track = user.get_tracks(recording_id)[0]
        track_tags = track.get("TrackTags", [])
        rec_ai_tag = [tag["what"] for tag in track_tags if tag["automatic"]]
        assert rec_ai_tag == ai_tag

        rec_manual_tags = [tag["what"] for tag in track_tags if not tag["automatic"]]
        for tag in rec_manual_tags:
            assert tag in manual_tags
