from datetime import datetime, timedelta
import dateutil.parser
from dateutil.parser import parse as parsedate


class TestAlert:
    def test_alert(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        alert_id = colonel.create_alert("Colonel alert")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)

        print("The colonel creates an alert for his device on possums")
        colonel.add_alert_condition(alert_id, "possum")
        colonel.add_alert_device(alert_id, colonel_device._id)

        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        print("The colonels device detects a 2 possums and 1 rat")
        rec, track, _ = helper.upload_recording_with_tag(
            colonel_device, colonel, "possum", time=now - timedelta(minutes=4), duration=90
        )

        helper.upload_recording_with_tag(
            colonel_device, colonel, "rat", time=now - timedelta(minutes=4), duration=90
        )
        helper.upload_recording_with_tag(
            colonel_device, colonel, "possum", time=now - timedelta(minutes=4), duration=90
        )
        sharleens_device = helper.given_new_device(self, "sharleens_device", colonel_group)

        print("Sharleens device detects a possum, this shouldn't trigger an alert")
        helper.upload_recording_with_tag(
            sharleens_device, colonel, "possum", time=now - timedelta(minutes=4), duration=90
        )
        alert = colonel.get_alert(alert_id)
        alert_logs = alert.get("AlertLogs", [])
        print("Only one alert should be triggered from the first possum")
        assert len(alert_logs) == 1
        assert alert_logs[0]["recId"] == rec.id_
        assert alert_logs[0]["trackId"] == track.id_
