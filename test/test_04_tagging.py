import pytest
from helper import Helper

class TestTagging:

     def test_recording_can_be_retreived_by_tagmode_types(self):
        helper = Helper()
        admin = helper.admin_user()

        destroyer = helper.given_new_device(self, 'The Destroyer')

        possum_human = destroyer.has_recording().is_tagged_as("possum").by(admin)
        
        bird_both = destroyer.has_recording().is_tagged_as("bird").by(admin)
        bird_both.is_tagged_as("bird").byAI(admin)
        stoat_ai = destroyer.has_recording().is_tagged_as("stoat").byAI(admin)
        rat_both_diff = destroyer.has_recording().is_tagged_as("rat").by(admin)
        rat_both_diff.is_tagged_as("hedgehog").byAI(admin)
        no_tag = destroyer.has_recording()
        
        allrecordings = [possum_human, bird_both, stoat_ai, rat_both_diff, no_tag]        

        admin.can_see_recordings(*allrecordings)
        
        admin.when_searching_with_tagmode("any").can_see_all_recordings_from_(allrecordings)

        admin.when_searching_with_tagmode("untagged").can_only_see_recordings(no_tag).from_(allrecordings)
        admin.when_searching_with_tagmode("tagged").can_only_see_recordings(possum_human, bird_both, stoat_ai, rat_both_diff).from_(allrecordings)

        admin.when_searching_with_tagmode("no-human").can_only_see_recordings(no_tag, stoat_ai).from_(allrecordings)

        admin.when_searching_with_tagmode("human-only").can_only_see_recordings(possum_human).from_(allrecordings)

        admin.when_searching_with_tagmode("automatic-only").can_only_see_recordings(stoat_ai).from_(allrecordings)

        admin.when_searching_with_tagmode("automatic+human").can_only_see_recordings(rat_both_diff, bird_both).from_(allrecordings)
