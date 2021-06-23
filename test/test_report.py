from datetime import datetime, timedelta, timezone
import dateutil.parser
import dateutil.tz as tz


class TestReport:
    def test_report(self, helper):
        user = helper.admin_user()

        # Create devices
        device0 = helper.given_new_device(self)
        device0.location = [20.00025, 20.00025]
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

        rec3 = device1.upload_audio_recording()

        # Add recording tag to 1st recording.
        rec0.is_tagged_as(what="cool").by(user)

        # Add track and track tags to rec1
        user.update_recording(rec1, comment="foo")
        track = user.can_add_track_to_recording(rec1)
        user.can_tag_track(track, what="possum", automatic=True)
        user.can_tag_track(track, what="rat", automatic=False)
        user.can_tag_track(track, what="stoat", automatic=False)

        # with audiobait
        report = ReportChecker(user.get_report(limit=10, audiobait="true"))
        report.check_line(rec0, device0)
        report.check_line(rec1, device0)
        report.check_line(rec2, device1)
        report.check_line(rec3, device1)
        report.check_audiobait(rec0, exp_audio_bait_name, exp_audio_bait_time)
        report.check_audiobait(rec1, exp_audio_bait_name, exp_audio_bait_time)

        # without audiobait
        report2 = ReportChecker(user.get_report(limit=10))
        report2.check_line(rec0, device0)
        report2.check_line(rec1, device0)
        report2.check_line(rec2, device1)
        report2.check_line(rec3, device1)
        report2.check_no_audiobait(rec0)

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
            recording_id = int(line["Id"])
            assert recording_id not in self._lines
            self._lines[recording_id] = line

    def check_no_audiobait(self, rec):
        line = self._lines.get(rec.id_)
        assert "Audio Bait" not in line

    def check_audiobait(self, rec, exp_audio_bait_name=None, exp_audio_bait_time=None):
        line = self._lines.get(rec.id_)
        if exp_audio_bait_name:
            assert line["Audio Bait"] == exp_audio_bait_name
            assert line["Audio Bait Volume"] == "8"
        else:
            assert line["Audio Bait"] == ""
            assert line["Mins Since Audio Bait"] == ""
            assert line["Audio Bait Volume"] == ""

    def check_line(self, rec, device):
        line = self._lines.get(rec.id_)
        assert line is not None
        assert line["Type"] == rec["type"]
        assert int(line["Duration"]) == rec["duration"]
        assert line["Group"] == device.group
        assert line["Device"] == device.devicename
        if device.location:
            assert line["Latitude"] == "{}".format(device.location[0])
            assert line["Longitude"] == "{}".format(device.location[1])

        assert line["Comment"] == rec["comment"]
        assert line["BatteryPercent"] == "98"
        assert int(line["Track Count"]) == len(rec.tracks)

        expected_auto_tags = []
        expected_human_tags = []
        for track in rec.tracks:
            for tag in track.tags:
                if tag.automatic:
                    expected_auto_tags.append(tag.what)
                else:
                    expected_human_tags.append(tag.what)

        assert line["Automatic Track Tags"] == format_tags(expected_auto_tags)
        assert line["Human Track Tags"] == format_tags(expected_human_tags)
        assert line["Recording Tags"] == format_tags(t["what"] for t in rec.tags)

        assert line["URL"] == "http://test.site/recording/" + str(rec.id_)
        index = rec.props.get("additionalMetadata", {}).get("analysis", {}).get("cacophony_index")
        if index:
            percents = [str(period["index_percent"]) for period in index]
            assert line["Cacophony Index"] == ";".join(percents)
        else:
            assert line["Cacophony Index"] == ""


def format_tags(items):
    return "+".join(items)
