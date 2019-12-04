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
