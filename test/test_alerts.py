from datetime import datetime, timedelta
import dateutil.parser
from dateutil.parser import parse as parsedate


class TestAlert:
    def makealert(self, name, tag, deviceId, automatic=True, frequency=None):
        return {
            "name": name,
            "conditions": [{"tag": tag, "automatic": automatic}],
            "frequencySeconds": frequency,
            "DeviceId": deviceId,
        }

    def test_alert(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)

        alert = self.makealert("Colonel alert", "possum", colonel_device._id)
        print("The colonel creates an alert for his device on possums")
        alert_id = colonel.create_alert(alert)

        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        print("The colonels device detects a 2 possums and 1 rat")

        print("rat does not trigger an alert")
        alert = colonel.get_alert(alert_id)
        assert len(alert.get("AlertLogs", [])) == 0
        helper.upload_recording_with_tag(
            colonel_device, colonel, "rat", time=now - timedelta(minutes=4), duration=90
        )
        rec, track, _ = helper.upload_recording_with_tag(
            colonel_device, colonel, "possum", time=now - timedelta(minutes=4), duration=90
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
