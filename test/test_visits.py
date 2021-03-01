import csv

from datetime import datetime, timedelta
import dateutil.parser
from dateutil.parser import parse as parsedate


class TestVisits:
    VISIT_INTERVAL_SECONDS = 600

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
        visit = response["visits"][0]
        assert visit["what"] == "cat"
        assert visit["deviceName"] == device.devicename
        assert len(visit["events"]) == 3

    def test_load_offset(self, helper):
        admin = helper.admin_user()
        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        animals = ["possum", "cat", "rodent"]
        # make 3 visits per animal
        for i in range(len(animals) * 3):
            helper.upload_recording_with_tag(
                device, admin, animals[int(i / 3)], time=now - timedelta(minutes=i * 20)
            )
        offset = 0

        # visits query always gets 2 * limit in recordings as an attempt to get limit visits
        # after they are groupedd, so by choosing limit 2 it will look for 4 Recordings
        # first 3 will make a complete visit, and last one will not be complete
        limit = 2
        for i in range(3):
            if i == 2:
                # last query needs to be more than 2 so it knows to complete the final visit
                # as no other recordings are available
                limit = 3
            response = cosmo.query_visits(return_json=True, limit=limit, offset=offset)
            offset = response["queryOffset"]
            assert response["numVisits"] == 3
            summary = response["summary"][str(device.get_id())]
            assert list(summary.keys()) == [animals[i]]
            assert summary[animals[i]]["visitCount"] == 3

        response = cosmo.query_visits(return_json=True)
        summary = response["summary"][str(device.get_id())]
        assert list(summary.keys()) == animals
        assert len(response["visits"]) == 9


    def test_visit_vote(self, helper):
        admin = helper.admin_user()
        cosmo = helper.given_new_user(self, "cosmo")
        cosmo_group = helper.make_unique_group_name(self, "cosmos_group")
        cosmo.create_group(cosmo_group)
        device = helper.given_new_device(self, "cosmo_device", cosmo_group)
        now = datetime.now(dateutil.tz.gettz(helper.TIMEZONE)).replace(microsecond=0)

        # 2 cats and 1 possum and 1 unidentified means a cat visit
        helper.upload_recording_with_tag(device, admin, "possum")
        helper.upload_recording_with_tag(device, admin, "unidentified", time=now - timedelta(minutes=9))
        helper.upload_recording_with_tag(device, admin, "cat", time=now - timedelta(seconds=18))
        helper.upload_recording_with_tag(device, admin, "cat", time=now - timedelta(seconds=20))

        response = cosmo.query_visits(return_json=True)
        assert response["numVisits"] == 1
        assert response["visits"][0]["what"] == "cat"

    def test_audio_bait(self, helper):
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

        device.record_event("audioBait", {"fileId": sound1}, [now - timedelta(minutes=9)])
        rec, _, _ = helper.upload_recording_with_tag(device, admin, "possum", duration=90)
        device.record_event(
            "audioBait",
            {"fileId": sound2, "volume": 9},
            [now - timedelta(seconds=40)],
        )
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="possum")

        response = cosmo.query_visits(return_json=True)
        assert response["numVisits"] == 1
        visit = response["visits"][0]
        print("visit is an audio bait visit with 2 audio events")
        assert visit["audioBaitDay"]
        assert visit["audioBaitVisit"]
        assert len(visit["audioBaitEvents"]) == 2

    def test_visits2(self, helper):
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

        # visit 1 - 4 minutes ago
        # unidentified gets grouped with cat
        helper.upload_recording_with_tag(
            device, admin, "unidentified", time=now - timedelta(minutes=4), duration=90
        )
        helper.upload_recording_with_tag(device, admin, "cat", time=now - timedelta(minutes=1), duration=90)

        # visit 2 - visit interval  + track duration + visit 1 (start) seconds ago
        helper.upload_recording_with_tag(
            device,
            admin,
            "possum",
            time=now - timedelta(seconds=TestVisits.VISIT_INTERVAL_SECONDS + 11, minutes=4),
            duration=10,
        )

        # visit 3 - 30 minutes ago
        device.record_event("audioBait", {"fileId": sound1}, [now - timedelta(minutes=39)])
        rec, _, _ = helper.upload_recording_with_tag(
            device, admin, "possum", time=now - timedelta(minutes=30), duration=90
        )
        device.record_event(
            "audioBait",
            {"fileId": sound2, "volume": 9},
            [now - timedelta(minutes=29)],
        )
        track = admin.can_add_track_to_recording(rec, start_s=80)
        admin.can_tag_track(track, what="unidentified")

        # visit 4 - 1 hour ago
        # future 3 unidentified gets grouped with cat

        helper.upload_recording_with_tag(device, admin, "cat", time=now - timedelta(minutes=120, seconds=10))
        helper.upload_recording_with_tag(device, admin, "unidentified", time=now - timedelta(minutes=117))
        helper.upload_recording_with_tag(device, admin, "unidentified", time=now - timedelta(minutes=114))
        helper.upload_recording_with_tag(
            device, admin, "unidentified", time=now - timedelta(minutes=113), duration=10
        )

        # an event that should not show up in the visits
        device.record_event("audioBait", {"fileId": sound2}, [now + timedelta(days=1, seconds=1)])

        response = cosmo.query_visits(return_json=True)
        assert response["numVisits"] == 4

        summary = response["summary"][str(device.get_id())]
        distinct_animals = set(summary.keys())
        assert distinct_animals == set(["possum", "cat"])

        possum_visits = summary["possum"]
        assert possum_visits["visitCount"] == 2

        possum_visits = [visit for visit in response["visits"] if visit["what"] == "possum"]
        possum_visits = sorted(possum_visits, key=lambda x: x["start"])
        print("Earliest visit is an audio bait visit with 2 audio events")
        assert possum_visits[0]["audioBaitDay"]
        assert possum_visits[0]["audioBaitVisit"]
        assert len(possum_visits[0]["audioBaitEvents"]) == 2

        audio_events = possum_visits[0]["audioBaitEvents"]
        audio_events = sorted(audio_events, key=lambda x: parsedate(x["dateTime"]))

        sound1_events = [audio for audio in audio_events if audio["fileName"] == sound1_name]
        sound2_events = [audio for audio in audio_events if audio["fileName"] == sound2_name]
        assert parsedate(sound1_events[0]["dateTime"]) == now - timedelta(minutes=39)
        assert parsedate(sound2_events[0]["dateTime"]) == now - timedelta(minutes=29)

        print("and the first visit is not an audio event")
        assert possum_visits[1]["audioBaitDay"]
        assert not possum_visits[1].get("audioBaitVisit")

        print("The last visit from a cat has 3 unidentified")
        cat_visit = response["visits"][-1]
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

        visits = []

        # visit
        visit = []
        rec, track, tag = helper.upload_recording_with_tag(device, admin, "possum")
        visit.append(event_line(rec, track, tag))
        visits.append(visit)

        # visit
        visit = []
        # unidentified gets grouped with cat
        rec, track, tag = helper.upload_recording_with_tag(
            device,
            admin,
            "unidentified",
            time=now - timedelta(seconds=TestVisits.VISIT_INTERVAL_SECONDS + 11),
            duration=10,
        )
        event = event_line(rec, track, tag)
        visit.append(event)

        rec, track, tag = helper.upload_recording_with_tag(
            device,
            admin,
            "cat",
            time=now - timedelta(seconds=TestVisits.VISIT_INTERVAL_SECONDS, minutes=1),
            duration=90,
        )
        visit.append(event_line(rec, track, tag))
        visits.append(visit)

        # visit
        visit = []

        rec, track, tag = helper.upload_recording_with_tag(
            device, admin, "possum", time=now - timedelta(minutes=30), duration=10
        )
        visit.append(event_line(rec, track, tag))
        device.record_event(
            "audioBait",
            {"fileId": sound2, "volume": 9},
            [now - timedelta(minutes=31)],
        )
        visit.append(audio_line(sound2_name, now - timedelta(minutes=31), 9))

        device.record_event("audioBait", {"fileId": sound1}, [now - timedelta(minutes=39)])
        audio_event = audio_line(sound1_name, now - timedelta(minutes=39))
        visit.append(audio_event)

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
        for visit in expected_visits:
            events = sorted(visit, key=lambda event: event["timestamp"], reverse=True)
            line = next(self._visits)
            assert line["Type"] == "Visit"
            for event in events:
                line = next(self._visits)
                for key, value in event.items():
                    if key == "timestamp":
                        continue
                    assert value == line[key]
