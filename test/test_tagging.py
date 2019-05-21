class TestTagging:
    def test_tag_deletion(self, helper):
        lucy = helper.given_new_user(self, "lucy")
        admin = helper.admin_user()
        sophie = helper.given_new_user(self, "sophie")

        group = lucy.create_group(helper.make_unique_group_name(self, "lucys_group"))
        device = helper.given_new_device(self, "Rec", group, description='')
        untagged = device.has_recording()

        tag = untagged.is_tagged_as("possum").by(lucy)
        lucy.delete_recording_tag(tag["tagId"])

        tag = untagged.is_tagged_as("cat").by(lucy)
        admin.delete_recording_tag(tag["tagId"])

        tag = untagged.is_tagged_as("cat").by(lucy)
        sophie.cannot_delete_recording_tag(tag["tagId"])

