class TestTagging:
    def test_tag_deletion(self, helper):
        lucy = helper.given_new_user(self, "lucy")
        admin = helper.admin_user()
        sophie = helper.given_new_user(self, "sophie")

        group = lucy.create_group(helper.make_unique_group_name(self, "lucys_group"))
        device = helper.given_new_device(self, "Rec", group, description="")
        untagged = device.has_recording()

        tag = untagged.is_tagged_as(what="possum").by(lucy)
        lucy.delete_recording_tag(tag["tagId"])

        tag = untagged.is_tagged_as(what="cat").by(lucy)
        admin.delete_recording_tag(tag["tagId"])

        tag = untagged.is_tagged_as(what="cat").by(lucy)
        sophie.cannot_delete_recording_tag(tag["tagId"])

    def test_default_tag_version(self, helper):
        "Ensure the default version is set if not supplied"
        recording = helper.given_new_device(self).has_recording()
        admin = helper.admin_user()
        recording.is_tagged_as(what="possum").by(admin)

        recording = admin.get_recording(recording)
        assert len(recording["Tags"]) == 1
        assert recording["Tags"][0]["version"] == 0x0100

    def test_set_tag_version(self, helper):
        recording = helper.given_new_device(self).has_recording()
        admin = helper.admin_user()
        recording.is_tagged_as(what="possum", version=0x0201).by(admin)

        props = admin.get_recording(recording)
        assert len(props["Tags"]) == 1
        assert props["Tags"][0]["version"] == 0x0201

    def test_legacy_tag_fields(self, helper):
        recording = helper.given_new_device(self).has_recording()
        admin = helper.admin_user()

        # Set tags using old legacy names.
        recording.is_tagged_as(animal="possum", event="chillin").by(admin)

        props = admin.get_recording(recording)
        assert len(props["Tags"]) == 1
        tag = props["Tags"][0]

        assert tag["what"] == "possum"
        assert tag["animal"] == "possum"  # alias for "what"

        assert tag["detail"] == "chillin"
        assert tag["event"] == "chillin"  # alias for "detail"

    def test_legacy_tag_fields_in_query(self, helper):
        recording = helper.given_new_device(self).has_recording()
        admin = helper.admin_user()
        recording.is_tagged_as(what="foo", detail="bar").by(admin)

        # Query recent recordings and find the entry.
        results = [r for r in admin.query_recordings(limit=5) if r["id"] == recording.id_]
        assert len(results) == 1

        tags = results[0]["Tags"]
        assert len(tags) == 1
        tag = tags[0]

        assert tag["what"] == "foo"
        assert tag["animal"] == "foo"  # alias for "what"

        assert tag["detail"] == "bar"
        assert tag["event"] == "bar"  # alias for "detail"

    def test_bulk_tagging(self, helper):
        # NOTE: This test relies on other tests preceding it having left some human-untagged tracks in the database
        admin = helper.admin_user()
        joe_public = helper.given_new_user(self, "could_be_anyone")
        # Get a random recording as joe public
        result = joe_public.get_recording_needs_tag()
        assert result is not None
        assert len(result["rows"]) == 1
        result = result["rows"][0]
        tracks = result["tracks"]
        assert len(tracks) > 0
        recording_id = result["RecordingId"]
        device_id = result["DeviceId"]
        track_id = tracks[0]["TrackId"]
        # Test ability to add a tag to recording
        track_tag_id = joe_public.tag_track_as_unauthorised_user(
            recording_id=recording_id, track_id=track_id, what="moa", tag_jwt=result["tagJWT"]
        )
        assert track_tag_id is not None

        # Make sure the tag got added to the track
        recording_props = admin.get_recording_by_id(recording_id)
        r_tracks = [track for track in recording_props["Tracks"] if track["id"] == track_id]
        assert len(r_tracks) > 0
        track = r_tracks[0]
        track_tags = [
            track_tags
            for track_tags in track["TrackTags"]
            if track_tags["what"] == "moa" and track_tags["automatic"] is False
        ]
        assert len(track_tags) == 1

        # Test ability to remove a tag from recording
        joe_public.delete_track_tag_as_unauthorised_user(
            recording_id=recording_id, track_id=track_id, track_tag_id=track_tag_id, tag_jwt=result["tagJWT"]
        )

        # Make sure the tag got removed again
        recording_props = admin.get_recording_by_id(recording_id)
        r_tracks = [track for track in recording_props["Tracks"] if track["id"] == track_id]
        assert len(r_tracks) > 0
        track = r_tracks[0]
        track_tags = [
            track_tags
            for track_tags in track["TrackTags"]
            if track_tags["what"] == "moa" and track_tags["automatic"] is False
        ]
        assert len(track_tags) == 0

        # Test ability to get another random recording from the same device (could be the same recording in testing,
        # since there are not many eligible recordings)
        result = joe_public.get_recording_needs_tag(device_id)
        assert result is not None
        assert len(result["rows"]) == 1
        result = result["rows"][0]
        assert result["DeviceId"] == device_id
