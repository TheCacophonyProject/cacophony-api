from datetime import datetime, timedelta
import dateutil.parser
import dateutil.tz


class TestReport:
    def test_report(self, helper):
        user = helper.admin_user()

        # Create devices
        device0 = helper.given_new_device(self)
        device1 = helper.given_new_device(self)

        # Upload audio files
        now = datetime.now(dateutil.tz.tzlocal()).replace(microsecond=0)
        exp_audio_bait_name = "sound2"

        sound1 = user.upload_audio_bait({"name": exp_audio_bait_name})
        sound2 = user.upload_audio_bait({"name": "sound2"})
        sound3 = user.upload_audio_bait({"name": "sound3"})

        # Add older audio events for device0
        device0.record_event("audioBait", {"fileId": sound1}, [now - timedelta(minutes=5)])

        # This is sound we expect to see
        exp_audio_bait_time = now - timedelta(minutes=2)
        device0.record_event("audioBait", {"fileId": sound2, "volume": 8}, [exp_audio_bait_time])

        # these are past the recording time (shouldn't get used)
        device0.record_event("audioBait", {"fileId": sound3}, [now + timedelta(seconds=5)])
        device0.record_event("audioBait", {"fileId": sound3}, [now + timedelta(minutes=1)])

        # Add 2 recordings for device0
        rec0 = device0.upload_recording()
        rec1 = device0.upload_recording()

        # Add a recording for device1
        rec2 = device1.upload_recording()

        # Add recording tag to 1st recording.
        rec0.is_tagged_as(what="cool").by(user)

        # Add track and track tags to rec1
        user.update_recording(rec1, comment="foo")
        track = user.can_add_track_to_recording(rec1)
        user.can_tag_track(track, what="possum", automatic=True)
        user.can_tag_track(track, what="rat", automatic=False)
        user.can_tag_track(track, what="stoat", automatic=False)

        report = ReportChecker(user.get_report(limit=10))
        report.check_line(rec0, device0, exp_audio_bait_name, exp_audio_bait_time)
        report.check_line(rec1, device0, exp_audio_bait_name, exp_audio_bait_time)
        report.check_line(rec2, device1)

    def test_report_jwt_arg(self, helper):
        user = helper.admin_user()

        device = helper.given_new_device(self)
        rec = device.upload_recording()

        token = user.new_token()
        report = ReportChecker(user.get_report(limit=5, jwt=token))

        report.check_line(rec, device)


class ReportChecker:
    def __init__(self, lines):
        self._lines = {}
        for line in lines:
            recording_id = int(line["id"])
            assert recording_id not in self._lines
            self._lines[recording_id] = line

    def check_line(self, rec, device, exp_audio_bait_name=None, exp_audio_bait_time=None):
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

        if exp_audio_bait_name:
            assert line["audio_bait"] == exp_audio_bait_name
            assert_times_equiv(dateutil.parser.parse(line["audio_bait_time"]), exp_audio_bait_time)
            assert float(line["mins_since_audio_bait"]) == round(
                (recording_time - exp_audio_bait_time).total_seconds() / 60, 1
            )
            assert line["audio_bait_volume"] == "8"
        else:
            assert line["audio_bait"] == ""
            assert line["mins_since_audio_bait"] == ""
            assert line["audio_bait_volume"] == ""

        assert line["url"] == "http://test.site/recording/" + str(rec.id_)


def format_tags(items):
    return "+".join(items)


def assert_times_equiv(t1, t2):
    t1 = t1.replace(microsecond=0)
    t2 = t2.replace(microsecond=0)
    assert (t1 - t2).total_seconds() == 0
