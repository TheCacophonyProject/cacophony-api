class TestTagging:
    def test_tag_deletion(self, helper):
        lucy = helper.given_new_user(self, "lucy")
        admin = helper.admin_user()
        sophie = helper.given_new_user(self, "sophie")

        group = lucy.create_group(helper.make_unique_group_name(self, "lucys_group"))
        device = helper.given_new_device(self, "Rec", group, description="")
        untagged = device.has_recording()

        tag = untagged.is_tagged_as("possum").by(lucy)
        lucy.delete_recording_tag(tag["tagId"])

        tag = untagged.is_tagged_as("cat").by(lucy)
        admin.delete_recording_tag(tag["tagId"])

        tag = untagged.is_tagged_as("cat").by(lucy)
        sophie.cannot_delete_recording_tag(tag["tagId"])

    def test_default_tag_version(self, helper):
        "Ensure the default version is set if not supplied"
        recording = helper.given_new_device(self).has_recording()
        admin = helper.admin_user()
        recording.is_tagged_as("possum").by(admin)

        props = admin.get_recording(recording)
        assert len(props["Tags"]) == 1
        assert props["Tags"][0]["version"] == 0x0100

    def test_set_tag_version(self, helper):
        recording = helper.given_new_device(self).has_recording()
        admin = helper.admin_user()
        recording.is_tagged_as("possum", version=0x0201).by(admin)

        props = admin.get_recording(recording)
        assert len(props["Tags"]) == 1
        assert props["Tags"][0]["version"] == 0x0201
