import pytest
import json


class TestRecordingsFilterCombo:
    def test_get_by_device_and_tag(self, helper):
        george = helper.given_new_user(self, "george")
        group = george.create_group(helper.make_unique_group_name(self, "georges_group"))
        device1 = helper.given_new_device(self, "device1", group, description="")
        device2 = helper.given_new_device(self, "device2", group, description="")

        d1_possum = makeTaggedRecording("d1_possum", device1, helper, "possum")
        d2_possum = makeTaggedRecording("d2_possum", device2, helper, "possum")
        d1_rat = makeTaggedRecording("d1_rat", device1, helper, "rat")
        d2_rat = makeTaggedRecording("d2_rat", device2, helper, "rat")

        all = [d1_possum, d1_possum, d1_rat, d2_rat]
        george.when_searching_for_tagmode("any").can_only_see_recordings(*all).from_(all)

        expected = [d2_possum]
        george.when_searching_for_tagmode("tagged").tags(["possum"]).devices(
            [device2]
        ).can_only_see_recordings(*expected).from_(all)


def makeTaggedRecording(name, device, helper, tag):
    recording = device.has_recording()
    recording.name += name
    track = helper.admin_user().can_add_track_to_recording(recording)
    helper.admin_user().tag_track(track, tag)
    return recording
