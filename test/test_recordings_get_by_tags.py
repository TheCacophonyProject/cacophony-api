import pytest
import json


class TestRecordingsGetByTags:
    def testFindRecordingTags(self, helper):
        lucy = helper.given_new_user(self, "lucy")
        group = lucy.create_group(helper.make_unique_group_name(self, "lucys_group"))
        device = helper.given_new_device(self, "Rec", group, description='')

        untagged = device.has_recording()
        ai_possum = makeTaggedRecording(device, helper, ["possum"], lucy, [])
        human_possum = makeTaggedRecording(device, helper, [], lucy, ["possum"])
        ai_human_possum = makeTaggedRecording(device, helper, ["possum"], lucy, ["possum"])

        ai_possum2 = makeTrackTaggedRecording(device, helper, lucy, [["possum", None], ["cat", None]])
        human_possum2 = makeTrackTaggedRecording(device, helper, lucy, [["cat", None], ["cat", "possum"]])
        ai_human_possum2 = makeTrackTaggedRecording(device, helper, lucy, [["possum", "possum"]])

        # ai and human tags different - one track, on recording.
        ai_human_possum3 = makeTrackTaggedRecording(device, helper, lucy, [[None, "possum"]])
        ai_human_possum3.is_tagged_as(what="possum").byAI(helper.admin_user())

        all = [untagged, ai_possum, ai_possum2, human_possum, human_possum2, ai_human_possum,
               ai_human_possum2, ai_human_possum3]

        lucy.when_searching_for_tagmode_and_tags('any', []).can_see_all_recordings_from_(all)

        expected = all.copy()
        expected.remove(untagged)
        lucy.when_searching_for_tagmode_and_tags('tagged', ["possum"]) \
            .can_only_see_recordings(*expected).from_(all)

        expected = [human_possum, human_possum2, ai_human_possum, ai_human_possum2, ai_human_possum3]
        lucy.when_searching_for_tagmode_and_tags('human-tagged', ["possum"]) \
            .can_only_see_recordings(*expected).from_(all)

        expected = [ai_possum, ai_possum2, ai_human_possum, ai_human_possum2, ai_human_possum3]
        lucy.when_searching_for_tagmode_and_tags('automatic-tagged', ["possum"]) \
            .can_only_see_recordings(*expected).from_(all)

        expected = [ai_human_possum, ai_human_possum2, ai_human_possum3]
        lucy.when_searching_for_tagmode_and_tags('both-tagged', ["possum"]) \
            .can_only_see_recordings(*expected).from_(all)

        # Other animals
        expected_rat_cat = [ai_possum2, human_possum2]
        lucy.when_searching_for().tagmode('tagged').tags(["rat", "cat"]) \
            .can_only_see_recordings(*expected_rat_cat).from_(all)

        expected_rat_cat_possum = all.copy()
        expected_rat_cat_possum.remove(untagged)
        lucy.when_searching_for().tagmode('tagged').tags(["rat", "cat", "possum"]) \
            .can_only_see_recordings(*expected_rat_cat_possum).from_(all)

        # no animal tags
        expected = [untagged]
        lucy.when_searching_for_tagmode('untagged').can_only_see_recordings(*expected).from_(all)

        expected = [untagged, ai_possum, ai_possum2]
        lucy.when_searching_for_tagmode('no-human').can_only_see_recordings(*expected).from_(all)

        expected = [ai_possum, ai_possum2]
        lucy.when_searching_for_tagmode('automatic-only').can_only_see_recordings(*expected).from_(all)

        expected = [human_possum]
        lucy.when_searching_for_tagmode('human-only').can_only_see_recordings(*expected).from_(all)

        expected = [ai_human_possum, ai_human_possum2, ai_human_possum3, human_possum2]
        lucy.when_searching_for_tagmode('automatic+human').can_only_see_recordings(*expected).from_(all)

    def testInterestingRecordingTags(self, helper):
        julie = helper.given_new_user(self, "julie")
        group = julie.create_group(helper.make_unique_group_name(self, "julies_group"))
        device = helper.given_new_device(self, "Rec", group, description='')

        animal = makeTaggedRecording(device, helper, ["possum"], julie, [])
        false_positive = makeTaggedRecording(device, helper, ["false positive"], julie, [])
        bird = makeTaggedRecording(device, helper, [], julie, ["bird"])

        all = [animal, false_positive, bird]

        julie.when_searching_for_tagmode_and_tags('tagged', ["interesting"]) \
            .can_only_see_recordings(animal).from_(all)
        julie.when_searching_for().tagmode('tagged').tags(["interesting", "bird"]) \
            .can_only_see_recordings(animal, bird).from_(all)
        julie.when_searching_for().tagmode('tagged').tags(["interesting", "false positive"]) \
            .can_only_see_recordings(animal, false_positive).from_(all)

    def testInterestingRecordingTrackTags(self, helper):
        julie = helper.given_new_user(self, "julie")
        group = julie.create_group(helper.make_unique_group_name(self, "julies_group"))
        device = helper.given_new_device(self, "Rec", group, description='')

        animal = makeTrackTaggedRecording(device, helper, julie, [["possum", None]])
        false_positive = makeTrackTaggedRecording(device, helper, julie, [[None, "false positive"]])
        bird = makeTrackTaggedRecording(device, helper, julie, [["bird", "bird"]])

        all = [animal, false_positive, bird]

        julie.when_searching_for_tagmode_and_tags('tagged', ["interesting"]) \
            .can_only_see_recordings(animal).from_(all)
        julie.when_searching_for().tagmode('tagged').tags(["interesting", "bird"]) \
            .can_only_see_recordings(animal, bird).from_(all)
        julie.when_searching_for().tagmode('tagged').tags(["interesting", "false positive"]) \
            .can_only_see_recordings(animal, false_positive).from_(all)


def makeTaggedRecording(device, helper, ai_tags, tagger, human_tags):
    recording = device.has_recording()
    recording.name = "ai:" + str(ai_tags) + " human: " + str(human_tags)
    for tag in ai_tags:
        recording.is_tagged_as(what=tag).byAI(helper.admin_user())

    for tag in human_tags:
        recording.is_tagged_as(what=tag).by(tagger)
    return recording


def makeTrackTaggedRecording(device, helper, tagger, trackTags):
    recording = device.has_recording()
    for combo in trackTags:
        recording.name += "tags: " + str(combo)
        track = helper.admin_user().can_add_track_to_recording(recording)
        if combo[0]:
            helper.admin_user().tag_track_as_AI(track, combo[0])
        if combo[1]:
            tagger.tag_track(track, combo[1])
    return recording
