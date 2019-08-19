from datetime import datetime, timedelta
import dateutil.parser
import dateutil.tz


class TestReport:
    def test_report(self, helper):
        device = helper.given_new_device(self)
        user = helper.admin_user()
        now = datetime.now()

        # Add some audio events
        now = datetime.now(dateutil.tz.tzlocal()).replace(microsecond=0)
        file_id = user.upload_audio_bait({"name": "other-sound"})
        device.record_event("audioBait", {"fileId": file_id}, [now - timedelta(minutes=5)])

        exp_audio_bait_name = "some-sound"
        exp_audio_bait_time = now - timedelta(minutes=2)  # newer
        file_id = user.upload_audio_bait({"name": exp_audio_bait_name})
        device.record_event("audioBait", {"fileId": file_id}, [exp_audio_bait_time])

        # Add 2 recordings
        rec1 = device.upload_recording()
        rec2 = device.upload_recording()

        # Add recording tag to 1st recording.
        rec1.is_tagged_as(what="cool").by(user)

        # Add track and track tags to 2nd recording.
        user.update_recording(rec2, comment="foo")
        track = user.can_add_track_to_recording(rec2)
        user.can_tag_track(track, what="possum", automatic=True)
        user.can_tag_track(track, what="rat", automatic=False)
        user.can_tag_track(track, what="stoat", automatic=False)

        report = ReportChecker(user.get_report(limit=10))
        report.check_line(rec1, device, exp_audio_bait_name, exp_audio_bait_time)
        report.check_line(rec2, device, exp_audio_bait_name, exp_audio_bait_time)


class ReportChecker:
    def __init__(self, lines):
        self._lines = {}
        for line in lines:
            recording_id = int(line["id"])
            assert recording_id not in self._lines
            self._lines[recording_id] = line

    def check_line(self, rec, device, exp_audio_bait_name, exp_audio_bait_time):
        line = self._lines.get(rec.id_)
        assert line is not None

        recording_time = dateutil.parser.parse(rec["recordingDateTime"])

        assert line["type"] == rec["type"]
        assert int(line["duration"]) == rec["duration"]
        assert line["group"] == device.group
        assert line["device"] == device.devicename
        assert_times_equiv(dateutil.parser.parse(line["timestamp"]), recording_time)
        assert line["comment"] == rec["comment"]
        assert int(line["track_count"]) == len(rec.tracks)

        expected_auto_tags = []
        expected_human_tags = []
        for track in rec.tracks:
            for tag in track.tags:
                if tag.automatic:
                    expected_auto_tags.append(tag.what)
                else:
                    expected_human_tags.append(tag.what)

        assert line["automatic_track_tags"] == format_tags(expected_auto_tags)
        assert line["human_track_tags"] == format_tags(expected_human_tags)
        assert line["recording_tags"] == format_tags(t["what"] for t in rec.tags)

        assert line["last_audio_bait"] == exp_audio_bait_name
        assert_times_equiv(dateutil.parser.parse(line["last_audio_bait_time"]), exp_audio_bait_time)
        assert float(line["mins_since_last_audio_bait"]) == round(
            (recording_time - exp_audio_bait_time).total_seconds() / 60, 1
        )

        assert line["url"] == "http://test.site/recording/" + str(rec.id_)


def format_tags(items):
    return "+".join(items)


def assert_times_equiv(t1, t2):
    t1 = t1.replace(microsecond=0)
    t2 = t2.replace(microsecond=0)
    assert (t1 - t2).total_seconds() == 0
