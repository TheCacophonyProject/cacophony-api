import pytest
from .testexception import BadRequestError


class TestAlert:
    def test_alert_bad_alert_condition(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)
        print("The colonel creates an alert for his device on possums 0 frequency, automatic tags")
        alert = {
            "name": "bad condition",
            "conditions": [{"tag": "any", "automaticF": True}],
            "frequencySeconds": 0,
            "DeviceId": colonel_device.get_id(),
        }
        with pytest.raises(BadRequestError):
            colonel.create_alert(alert)

    def test_alert_automatic(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)
        print("The colonel creates an alert for his device on possums 0 frequency, automatic tags")
        alert_id = make_alert(colonel, "Colonel always alert", "possum", colonel_device._id, frequency=0)

        print("Colonel's tags a recording as possum")
        helper.upload_recording_with_tag(colonel_device, colonel, "possum", automatic=False)
        alert = colonel.get_alert(alert_id)
        assert alert["lastAlert"] is None

        print("AI detects a possum on Colonel's device")
        rec, track, _ = helper.upload_recording_with_tag(colonel_device, colonel, "possum", automatic=True)

        alert_event = colonel.can_see_events(device=colonel_device, type="alert", latest=True)
        print("Only one alert should be triggered from the last possum")
        assert len(alert_event) == 1
        check_event(alert_event[0], alert_id, rec.id_, track.id_)

    def test_alert_human(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)
        print("The colonel creates an alert for his device on possums 0 frequency, automatic tags")
        alert_id = make_alert(
            colonel, "Colonel always alert", "possum", colonel_device._id, frequency=0, automatic=False
        )

        print("AI detects a possum on Colonel's device")
        helper.upload_recording_with_tag(colonel_device, colonel, "possum", automatic=True)
        alert = colonel.get_alert(alert_id)
        assert alert["lastAlert"] is None

        print("Colonel's tags a recording as possum")
        rec, track, _ = helper.upload_recording_with_tag(colonel_device, colonel, "possum", automatic=False)
        alert_event = colonel.can_see_events(device=colonel_device, type="alert", latest=True)
        print("Only one alert should be triggered from the last possum")
        assert len(alert_event) == 1
        check_event(alert_event[0], alert_id, rec.id_, track.id_)

    def test_alert_device(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)

        alert_id = make_alert(colonel, "Colonel alert", "possum", colonel_device._id)
        print("The colonel creates an alert for his device on possums")

        print("AI detects a rat on Colonel's device, no should be alert sent")
        helper.upload_recording_with_tag(colonel_device, colonel, "rat", automatic=True)
        alert = colonel.get_alert(alert_id)
        assert alert["lastAlert"] is None

        print("AI detects a possum on Sharleen's device, no should be alert sent")
        sharleens_device = helper.given_new_device(self, "sharleens_device", colonel_group)
        helper.upload_recording_with_tag(sharleens_device, colonel, "possum", automatic=True)
        alert = colonel.get_alert(alert_id)
        assert alert["lastAlert"] is None

        print("AI detects a possum on Colonel's device")
        rec, track, _ = helper.upload_recording_with_tag(colonel_device, colonel, "possum", automatic=True)

        alert_event = colonel.can_see_events(device=colonel_device, type="alert", latest=True)
        print("Only one alert should be triggered from the first possum")
        assert len(alert_event) == 1
        check_event(alert_event[0], alert_id, rec.id_, track.id_)

    def test_alert_frequency(self, helper):
        colonel = helper.given_new_user(self, "colonel")
        colonel_group = helper.make_unique_group_name(self, "colonelGroup")
        colonel.create_group(colonel_group)
        colonel_device = helper.given_new_device(self, "colonel_device", colonel_group)

        print("Colonel makes a new alert with 50 frequency seconds and an alert with 0 frequency seconds")
        alert_less_id = make_alert(colonel, "Colonel less alerts", "possum", colonel_device._id, frequency=50)
        alert_id = make_alert(colonel, "Colonel always alert", "possum", colonel_device._id, frequency=0)

        print("AI detects 2 posusms in quick succesion on Colonel's device")
        first_rec, first_track, _ = helper.upload_recording_with_tag(
            colonel_device, colonel, "possum", automatic=True
        )
        second_rec, second_track, _ = helper.upload_recording_with_tag(
            colonel_device, colonel, "possum", automatic=True
        )

        print("Both possums should trigger an alert for 0 frequency seconds alert")
        all_events = colonel.can_see_events(device=colonel_device, type="alert", latest=True)
        events = [event for event in all_events if event["EventDetail"]["details"]["alertId"] == alert_id]
        assert len(events) == 2
        check_event(events[0], alert_id, second_rec.id_, second_track.id_)

        print("The first possum should trigger an alert for 50 second frequency alert")
        events = [
            event for event in all_events if event["EventDetail"]["details"]["alertId"] == alert_less_id
        ]
        assert len(events) == 1
        check_event(events[0], alert_less_id, first_rec.id_, first_track.id_)


def make_alert(user, name, tag, deviceId, automatic=True, frequency=None):
    alert = {
        "name": name,
        "conditions": [{"tag": tag, "automatic": automatic}],
        "frequencySeconds": frequency,
        "DeviceId": deviceId,
    }
    return user.create_alert(alert)


def check_event(event, alert_id, rec_id, track_id):
    details = event["EventDetail"]["details"]
    assert details["alertId"] == alert_id
    assert details["recId"] == rec_id
    assert details["trackId"] == track_id
