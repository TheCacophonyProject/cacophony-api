from datetime import datetime, timedelta, timezone
import dateutil.parser
from dateutil.parser import parse as parsedate
import dateutil.tz as tz


class TestVisits:
    VISIT_INTERVAL_SECONDS = 600

    def upload_recording_with_tag(self, device, user, what, time, duration=30):
        now = datetime.now(dateutil.tz.tzlocal()).replace(microsecond=0)

        rec = device.upload_recording({"recordingDateTime": "{}".format(time), "duration": duration})
        track = user.can_add_track_to_recording(rec)
        user.can_tag_track(track, what=what)
        return rec

    def test_report(self, helper):
        admin = helper.admin_user()
        sound1_name = "rodent-scream"
        sound1 = admin.upload_audio_bait({"name": sound1_name})
        sound2_name = "nice-bird"
        sound2 = admin.upload_audio_bait({"name": sound2_name})

        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        now = datetime.now(dateutil.tz.tzlocal()).replace(microsecond=0)

        # visit 1
        self.upload_recording_with_tag(device, admin, "cat", time=now, duration=90)

        # visit 2
        self.upload_recording_with_tag(
            device, admin, "possum", time=now - timedelta(seconds=TestVisits.VISIT_INTERVAL_SECONDS + 11)
        )

        # visit 3
        device.record_event("audioBait", {"fileId": sound1}, [now - timedelta(minutes=9)])
        rec = self.upload_recording_with_tag(device, admin, "possum", time=now, duration=90)
        device.record_event("audioBait", {"fileId": sound2}, [now + timedelta(seconds=40)])
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="possum")

        # an event that should not show up in the visits
        device.record_event("audioBait", {"fileId": sound2}, [now + timedelta(days=1, seconds=1)])

        response = cosmo.query_visits(return_json=True)
        assert response["count"] == 3

        device_map = response["rows"][str(device.get_id())]
        distinct_animals = set(device_map["animals"].keys())
        assert distinct_animals == set(["possum", "cat"])
        possum_visits = device_map["animals"]["possum"]["visits"]

        print("second visit starts more than 10 minutes after the first visit ends")
        second_visit_end = parsedate(possum_visits[1]["end"]) + timedelta(
            seconds=TestVisits.VISIT_INTERVAL_SECONDS
        )
        assert parsedate(possum_visits[0]["start"]) > second_visit_end

        print("last visit is an audio bait visit with 2 audio events")
        assert possum_visits[0]["audioBaitDay"]
        assert possum_visits[0]["audioBaitVisit"]
        assert len(possum_visits[0]["audioBaitEvents"]) == 2

        audio_events = possum_visits[0]["audioBaitEvents"]
        sound1_events = [audio for audio in audio_events if audio["fileName"] == sound1_name]
        sound2_events = [audio for audio in audio_events if audio["fileName"] == sound2_name]
        assert parsedate(sound1_events[0]["dateTime"]) == now - timedelta(minutes=9)
        assert parsedate(sound2_events[0]["dateTime"]) == now + timedelta(seconds=40)

        print("and the first visit is not an audio event")
        assert possum_visits[1]["audioBaitDay"]
        assert not possum_visits[1].get("audioBaitVisit")

        print("The visit from a cat was also an audio bait event")
        cat_visit = device_map["animals"]["cat"]["visits"][0]
        assert cat_visit["audioBaitDay"]
        assert cat_visit["audioBaitVisit"]
        audio_events = cat_visit["audioBaitEvents"]
        assert len(audio_events) == 1

        print("the audio event is the same as the event from the possum")
        assert audio_events[0]["id"] == sound1_events[0]["id"]
