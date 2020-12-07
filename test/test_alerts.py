from datetime import date, datetime, timedelta
import dateutil
from dateutil.parser import parse as parsedate


class TestAlert:
    def test_alert_device(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)

        alert = make_alert("Colonel alert", "possum", colonel_device._id)
        print("The colonel creates an alert for his device on possums")
        alert_id = colonel.create_alert(alert)

        print("Colones device detects a rat, this shouldn't trigger an alert")
        helper.upload_recording_with_tag(colonel_device, colonel, "rat")
        alert = colonel.get_alert(alert_id)
        assert len(alert.get("AlertLogs", [])) == 0

        print("Sharleens device detects a possum, this shouldn't trigger an alert")
        sharleens_device = helper.given_new_device(self, "sharleens_device", colonel_group)
        helper.upload_recording_with_tag(sharleens_device, colonel, "possum")
        alert = colonel.get_alert(alert_id)
        assert len(alert.get("AlertLogs", [])) == 0

        print("Colonels device detects a possum, this should trigger an alert")
        rec, track, _ = helper.upload_recording_with_tag(colonel_device, colonel, "possum")

        alert = colonel.get_alert(alert_id)
        alert_logs = alert.get("AlertLogs", [])
        print("Only one alert should be triggered from the first possum")
        assert len(alert_logs) == 1
        assert alert_logs[0]["recId"] == rec.id_
        assert alert_logs[0]["trackId"] == track.id_

    def test_alert_frequency(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)

        print("Colonel makes a new alert with 50 frequency seconds and an alert with 0 frequency seconds")
        alert = make_alert("Colonel less alerts", "possum", colonel_device._id, frequency=50)
        alert_less_id = colonel.create_alert(alert)
        alert = make_alert("Colonel always alert", "possum", colonel_device._id, frequency=0)
        alert_id = colonel.create_alert(alert)

        print("Colonels device detects 2 posusms in quick succesion")
        first_rec, first_track, _ = helper.upload_recording_with_tag(colonel_device, colonel, "possum")
        time = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)
        second_rec, second_track, _ = helper.upload_recording_with_tag(
            colonel_device, colonel, "possum", time=time
        )

        print("Both posusms should trigger an alert for 0 frequency seconds alert")
        alert = colonel.get_alert(alert_id)
        alert_logs = alert.get("AlertLogs", [])
        assert len(alert_logs) == 2
        assert parsedate(alert_logs[0]["updatedAt"]) > parsedate(alert_logs[1]["updatedAt"])
        check_alert(alert_logs[0], second_rec.id_, second_track.id_, time)

        print("The first posusm should trigger an alert for 50 second frequency alert")
        alert = colonel.get_alert(alert_less_id)
        alert_logs = alert.get("AlertLogs", [])
        assert len(alert_logs) == 1
        check_alert(alert_logs[0], first_rec.id_, first_track.id_, time)


def make_alert(name, tag, deviceId, automatic=True, frequency=None):
    return {
        "name": name,
        "conditions": [{"tag": tag, "automatic": automatic}],
        "frequencySeconds": frequency,
        "DeviceId": deviceId,
    }


def check_alert(alert_log, rec_id, track_id, time=None):
    assert alert_log["recId"] == rec_id
    assert alert_log["trackId"] == track_id
    if time:
        assert parsedate(alert_log["createdAt"]) - time < timedelta(seconds=10)
