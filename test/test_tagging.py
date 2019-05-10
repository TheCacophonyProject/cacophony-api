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

    def test_recording_can_be_retrieved_by_tagmode_types(self, helper):
        admin = helper.admin_user()

        destroyer = helper.given_new_device(self, "The Destroyer")

        possum_human = destroyer.has_recording()
        possum_human.is_tagged_as("possum").by(admin)

        bird_both = destroyer.has_recording()
        bird_both.is_tagged_as("bird").by(admin)
        bird_both.is_tagged_as("bird").byAI(admin)
        stoat_ai = destroyer.has_recording()
        stoat_ai.is_tagged_as("stoat").byAI(admin)
        rat_both_diff = destroyer.has_recording()
        rat_both_diff.is_tagged_as("rat").by(admin)
        rat_both_diff.is_tagged_as("hedgehog").byAI(admin)
        no_tag = destroyer.has_recording()

        allrecordings = [possum_human, bird_both, stoat_ai, rat_both_diff, no_tag]

        admin.can_see_recordings(*allrecordings)

        # Tagmode tests
        admin.when_searching_with_tagmode("any").can_see_all_recordings_from_(
            allrecordings
        )

        admin.when_searching_with_tagmode("untagged").can_only_see_recordings(
            no_tag
        ).from_(allrecordings)
        admin.when_searching_with_tagmode("tagged").can_only_see_recordings(
            possum_human, bird_both, stoat_ai, rat_both_diff
        ).from_(allrecordings)

        admin.when_searching_with_tagmode("no-human").can_only_see_recordings(
            no_tag, stoat_ai
        ).from_(allrecordings)

        admin.when_searching_with_tagmode("human-only").can_only_see_recordings(
            possum_human
        ).from_(allrecordings)

        admin.when_searching_with_tagmode("automatic-only").can_only_see_recordings(
            stoat_ai
        ).from_(allrecordings)

        admin.when_searching_with_tagmode("automatic+human").can_only_see_recordings(
            rat_both_diff, bird_both
        ).from_(allrecordings)

        # Specified tags tests
        print("Test human only tags found")
        admin.when_searching_for_tags("possum").can_only_see_recordings(
            possum_human
        ).from_(allrecordings)

        print("Test automatic only tags found")
        admin.when_searching_for_tags("stoat").can_only_see_recordings(stoat_ai).from_(
            allrecordings
        )

        print("Test first tag found if different")
        admin.when_searching_for_tags("hedgehog").can_only_see_recordings(
            rat_both_diff
        ).from_(allrecordings)

        print("Test second tag found if different")
        admin.when_searching_for_tags("rat").can_only_see_recordings(
            rat_both_diff
        ).from_(allrecordings)

        print("Test several tags found if different")
        admin.when_searching_for_tags(
            "possum", "bird", "stoat"
        ).can_only_see_recordings(possum_human, bird_both, stoat_ai).from_(
            allrecordings
        )
