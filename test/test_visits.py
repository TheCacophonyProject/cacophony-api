import csv

from datetime import datetime, timedelta
import dateutil.parser
from dateutil.parser import parse as parsedate


class TestVisits:
    VISIT_INTERVAL_SECONDS = 600

    def test_multiple_animals(self, helper):
        admin = helper.admin_user()
        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        # check that a recording with 2 possums and 1 cat, assumes the cat is a possum
        rec, _, _ = helper.upload_recording_with_tag(device, admin, "possum", time=now - timedelta(seconds=0))
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="possum")
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="cat")
        response = cosmo.query_visits(return_json=True)
        assert response["numVisits"] == 1
        visit = response["rows"][str(device.get_id())]["visits"][0]
        assert visit["what"] == "possum"
        assert len(visit["events"]) == 3

        device = helper.given_new_device(self, "cosmo_device2", cosmo_group)
        # check that a recording with 2 unidentified and 1 cat, assumes the unidentified is a cat
        rec, _, _ = helper.upload_recording_with_tag(
            device, admin, "unidentified", time=now - timedelta(seconds=0)
        )
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="unidentified")
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="cat")

        response = cosmo.query_visits(return_json=True, deviceIds=device.get_id())
        assert response["numVisits"] == 1
        visit = response["rows"][str(device.get_id())]["visits"][0]
        assert visit["what"] == "cat"
        assert len(visit["events"]) == 3

    def test_no_tag(self, helper):
        admin = helper.admin_user()
        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        # check that a recording with 1 untagged track, 1 unidentified and 1 cat, assumes the unidentified and untagged is a cat
        rec, _, _ = helper.upload_recording_with_tag(device, admin, "unidentified")
        track = admin.can_add_track_to_recording(rec, start_s=80)
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="cat")

        response = cosmo.query_visits(return_json=True, deviceIds=device.get_id())
        assert response["numVisits"] == 1
        visit = response["rows"][str(device.get_id())]["visits"][0]
        assert visit["what"] == "cat"
        assert len(visit["events"]) == 3

    def test_visit_grouping(self, helper):
        admin = helper.admin_user()
        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        # check that last 2 possums are grouped together
        helper.upload_recording_with_tag(device, admin, "possum", time=now - timedelta(seconds=0))
        helper.upload_recording_with_tag(device, admin, "possum", time=now - timedelta(seconds=10000))
        helper.upload_recording_with_tag(device, admin, "possum", time=now - timedelta(seconds=10000))
        response = cosmo.query_visits(return_json=True)
        assert response["numVisits"] == 2
        visits = response["rows"][str(device.get_id())]["visits"]
        most_recent = parsedate(visits[0]["start"])
        for visit in visits[1:]:
            assert parsedate(visit["end"]) < most_recent

    def test_visits(self, helper):
        # init device and sounds
        admin = helper.admin_user()
        sound1_name = "rodent-scream"
        sound1 = admin.upload_audio_bait({"name": sound1_name})
        sound2_name = "nice-bird"
        sound2 = admin.upload_audio_bait({"name": sound2_name})

        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        # no tag no visit
        helper.upload_recording_with_track(device, admin, time=now - timedelta(minutes=20), duration=90)

        # visit 1
        # unidentified gets grouped with cat
        helper.upload_recording_with_tag(
            device, admin, "unidentified", time=now - timedelta(minutes=4), duration=90
        )
        helper.upload_recording_with_tag(device, admin, "cat", time=now - timedelta(minutes=1), duration=90)

        # visit 2
        helper.upload_recording_with_tag(
            device, admin, "possum", time=now - timedelta(seconds=TestVisits.VISIT_INTERVAL_SECONDS + 11)
        )

        # visit 3
        device.record_event("audioBait", {"fileId": sound1}, [now - timedelta(minutes=9)])
        rec, _, _ = helper.upload_recording_with_tag(device, admin, "possum", time=now, duration=90)
        device.record_event("audioBait", {"fileId": sound2, "volume": 9}, [now + timedelta(seconds=40)])
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="possum")

        # visit 4
        # future 3 unidentified gets grouped with cat

        helper.upload_recording_with_tag(device, admin, "cat", time=now - timedelta(minutes=40, seconds=10))
        helper.upload_recording_with_tag(device, admin, "unidentified", time=now - timedelta(minutes=37))
        helper.upload_recording_with_tag(device, admin, "unidentified", time=now - timedelta(minutes=32))
        helper.upload_recording_with_tag(device, admin, "unidentified", time=now - timedelta(minutes=31))

        helper.upload_recording_with_tag(device, admin, "unidentified", time=now - timedelta(minutes=29))
        # an event that should not show up in the visits
        device.record_event("audioBait", {"fileId": sound2}, [now + timedelta(days=1, seconds=1)])

        response = cosmo.query_visits(return_json=True)
        assert response["numVisits"] == 5

        device_map = response["rows"][str(device.get_id())]
        distinct_animals = set(device_map["animals"].keys())
        assert distinct_animals == set(["possum", "cat", "unidentified"])

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

        print("The last visit from a cat has 3 unidentified")
        cat_visit = device_map["animals"]["cat"]["visits"][1]
        events = cat_visit["events"]
        cat_events = [event for event in events if event["what"] == "cat"]
        unidentified_events = [event for event in events if event["what"] == "unidentified"]
        assert len(cat_events) == 1
        assert len(unidentified_events) == 3

        print("Events are in descending start times")
        most_recent_start = parsedate(events[0]["start"])
        for past_event in events[1:]:
            past_date = parsedate(past_event["start"])
            assert past_date < most_recent_start

        print("the audio event is the same as the event from the possum")
        assert audio_events[0]["id"] == sound1_events[0]["id"]

    def test_report(self, helper):
        # init device and sounds
        admin = helper.admin_user()
        sound1_name = "rodent-scream"
        sound1 = admin.upload_audio_bait({"name": sound1_name})
        sound2_name = "nice-bird"
        sound2 = admin.upload_audio_bait({"name": sound2_name})

        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        animals_summary = []
        animals_summary.append({"what": "possum", "visits": 2, "audiobait": True, "events": []})
        animals_summary.append({"what": "cat", "visits": 1, "audiobait": True, "events": []})

        # no tag no visit
        helper.upload_recording_with_track(device, admin, time=now - timedelta(minutes=20), duration=90)

        visits = []

        # visit
        visit = []
        rec, track, tag = helper.upload_recording_with_tag(
            device, admin, "possum", time=now - timedelta(seconds=TestVisits.VISIT_INTERVAL_SECONDS + 11)
        )
        visit.append(event_line(rec, track, tag))
        visits.append(visit)

        # visit
        visit = []
        # unidentified gets grouped with cat
        rec, track, tag = helper.upload_recording_with_tag(
            device, admin, "unidentified", time=now - timedelta(minutes=4), duration=90
        )
        event = event_line(rec, track, tag)
        visit.append(event)

        rec, track, tag = helper.upload_recording_with_tag(
            device, admin, "cat", time=now - timedelta(minutes=1), duration=90
        )
        visit.append(event_line(rec, track, tag))
        visits.append(visit)

        # visits
        visit = []
        device.record_event("audioBait", {"fileId": sound1}, [now - timedelta(minutes=9)])
        audio_event = audio_line(sound1_name, now - timedelta(minutes=9))
        # this audio event is for the previous visit also
        visit.append(audio_event)
        visits[-1].append(audio_event)

        rec, track, tag = helper.upload_recording_with_tag(device, admin, "possum", time=now, duration=90)
        visit.append(event_line(rec, track, tag))

        device.record_event("audioBait", {"fileId": sound2, "volume": 9}, [now + timedelta(seconds=40)])
        visit.append(audio_line(sound2_name, now + timedelta(seconds=40), 9))

        track = admin.can_add_track_to_recording(rec, start_s=80)
        tag, admin.can_tag_track(track, what="possum")
        visit.append(event_line(rec, track, tag))
        visits.append(visit)

        report = ReportChecker(
            admin.get_report(limit=10, raw=True, deviceIds=[device.get_id()], report_type="visits")
        )
        report.check_summary(device.get_id(), animals_summary)
        report.check_visits(visits)


def audio_line(audio_file, time, volume=None):
    played = audio_file
    if volume:
        played = "{} vol {}".format(played, volume)
    return {
        "What": audio_file,
        "Start": time.strftime("%H:%M:%S"),
        "Audio Played": played,
        "timestamp": time.timestamp(),
    }


def event_line(rec, track, tag):
    rectime = parsedate(rec.props["recordingDateTime"])
    start = rectime + timedelta(seconds=track.data["start_s"])
    end = rectime + timedelta(seconds=track.data["end_s"])
    return {
        "Rec ID": str(rec.id_),
        "What": tag.what,
        "Start": start.strftime("%H:%M:%S"),
        "End": end.strftime("%H:%M:%S"),
        "timestamp": start.timestamp(),
    }


class ReportChecker:
    def __init__(self, lines):
        self._visits = []
        self._device_summary = {}
        reader = csv.DictReader(lines)
        i = 0
        for line in reader:
            if line["Device ID"] == "":
                # end of device summary
                self._visits = csv.DictReader(lines[i + 2 :])
                break

            line_id = int(line["Device ID"])
            if line_id not in self._device_summary:
                self._device_summary[line_id] = {"summary": line, "details": {}}
            else:
                self._device_summary[line_id]["details"][line["Animal"]] = line
            i += 1

    def check_summary(self, device_id, animals_summary):
        summary = self._device_summary[device_id]
        animals = set(summary["summary"]["Animal"].split(";"))
        expected_animals = set([animal["what"] for animal in animals_summary])

        assert expected_animals == set(animals)
        assert len(summary["details"]) == len(animals_summary)
        for expected in animals_summary:
            line = summary["details"][expected["what"]]
            assert int(line["# Visits"]) == expected["visits"]
            assert bool(line["Using Audio Bait"]) == expected["audiobait"]

    def check_visits(self, expected_visits):
        for visit in reversed(expected_visits):
            events = sorted(visit, key=lambda event: event["timestamp"], reverse=True)

            line = next(self._visits)
            assert line["Type"] == "Visit"
            for event in events:
                line = next(self._visits)
                for key, value in event.items():
                    if key == "timestamp":
                        continue
                    assert value == line[key]
