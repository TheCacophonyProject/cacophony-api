import pytest
import json

from datetime import datetime, timedelta, timezone
from test.testexception import AuthorizationError, UnprocessableError


class TestEvent:
    def test_system_errors(self, helper):
        user, device = helper.given_new_user_with_device(self, "error_maker")
        new_event_name = "systemError"
        unit_name = "coffeeMaker"

        lines = ["Failure due to {} existing with status 12".format("barrys v2500 is out of milk")]
        lines2 = ["Failure due to {} existing with status 12".format("franks rocket has no internet")]
        lines3 = ["Failure due to {} existing with status 12".format("franks rocket is out of milk")]

        details = {"version": 1, "unitName": unit_name, "activeState": "failed"}
        details["logs"] = lines
        screech = device.record_event(new_event_name, details)
        details["logs"] = lines2
        screech2 = device.record_event(new_event_name, details)
        details["logs"] = lines3
        screech2 = device.record_event(new_event_name, details)
        errors = user.can_see_event_errors()
        assert unit_name in errors
        service = errors[unit_name]
        assert len(service["errors"]) == 2
        assert set(len(error["similar"]) for error in service["errors"]) == set([1, 2])

    def test_cannot_create_event_type_with_funny_chars(self, helper):
        not_doer = helper.given_new_device(self, "The dont doer")

        with pytest.raises(UnprocessableError):
            not_doer.record_event("Type with spaces", {"lure-id": "possum_screech"})

        with pytest.raises(UnprocessableError):
            not_doer.record_event("Type_with_underscores", {"lure-id": "possum_screech"})

        with pytest.raises(UnprocessableError):
            not_doer.record_event("Type with $", {"lure-id": "possum_screech"})

    def test_can_create_new_event(self, helper):
        doer = helper.given_new_device(self, "The Do-er")
        new_event_name = "E-" + helper.random_id()

        screech = doer.record_event(new_event_name, {"lure-id": "possum_screech"})
        screech2 = doer.record_event(new_event_name, {"lure-id": "possum_screech"})

        print("Then these events with the same details should use the same eventDetailId.")
        assert screech == screech2, "And events with the same details should use the same eventDetailId"

        howl = doer.record_event(new_event_name, {"lure-id": "possum_howl"})

        print("Then the events with some different details should have different eventDetailIds.")
        assert screech != howl, "Events with different details should link to different eventDetailIds"

        no_lure_id = doer.record_event(new_event_name, "")

        print("Then the event with no details should should have a different eventDetailId.")
        assert screech != no_lure_id, "Events with no details should link to different eventDetailId."

    def test_can_upload_event_for_device(self, helper):
        data_collector, device = helper.given_new_user_with_device(self, "data_collector")

        # check there are no events on this device
        data_collector.cannot_see_events()

        print("   and data_collector uploads a event on behalf of the device")
        eventid = data_collector.record_event(device, "test", {"foo": "bar"})

        print("Then 'data_collector' should be able to see that the device has an event")
        assert len(data_collector.can_see_events()) == 1

        print("And super users should be able to see that the device has an event")
        assert len(helper.admin_user().can_see_events(device)) == 1

        print("But a new user shouldn't see any device events")
        user_without_device = helper.given_new_user(self, "grant")
        user_without_device.cannot_see_events()

        print("And should not be able to upload events for a device")
        with pytest.raises(AuthorizationError):
            user_without_device.record_event(device, "test2", {"foo2": "bar2"})

    def test_devices_share_events(self, helper):
        shaker = helper.given_new_device(self, "The Shaker")
        new_event_name = "E-" + helper.random_id()

        sameDetails = shaker.record_event(new_event_name, {"lure-id": "possum_screech"})

        print("    and ", end="")
        actioner = helper.given_new_device(self, "Actioner")

        sameDetailsDifferentDevice = actioner.record_event(new_event_name, {"lure-id": "possum_screech"})

        print("Then the devices should share the same eventDetailId.")
        assert (
            sameDetails == sameDetailsDifferentDevice
        ), "EventsDetails should be able to be linked to from different devices"

    def test_can_get_events(self, helper):
        fred, freds_device = helper.given_new_user_with_device(self, "freddie")

        # check there are no events on this device
        fred.cannot_see_events()

        freds_device.record_event("playLure", {"lure-id": "possum_screech"})

        print("Then 'freddie' should be able to see that the device has an event")
        assert len(fred.can_see_events()) == 1

        print("And super users should be able to see that the device has an event")
        assert len(helper.admin_user().can_see_events(freds_device)) == 1

        print("But a new user shouldn't see any device events")
        helper.given_new_user(self, "grant").cannot_see_events()

    def test_should_be_able_to_upload_several_events_at_same_time(self, helper):
        rocker = helper.given_new_device(self, "The Rocker")
        detailId = rocker.record_event("playLure", {"lure-id": "possum_screecher"})
        rocker.record_three_events_at_once(detailId)
        print("And super users should be able to see get all four events for the device")
        assert len(helper.admin_user().can_see_events(rocker)) == 4

    def test_get_event_attributes_returned(self, helper):
        boombox = helper.given_new_device(self, "boombox")
        description = "E_" + helper.random_id()
        boombox.record_event("audio-bait-played", {"lure-id": "possum_screams", "description": description})
        event = helper.admin_user().can_see_events(boombox)[0]
        print("Then get events returns an event")
        print("    with DeviceId = '{}'".format(boombox.get_id()))
        assert event["DeviceId"] == boombox.get_id()
        print("    and EventDetail.type = 'audio-bait-played'")
        assert event["EventDetail"]["type"] == "audio-bait-played"
        print("    and EventDetail.details.lure-id = 'possum_screems'")
        assert event["EventDetail"]["details"]["lure-id"] == "possum_screams"
        print("    and EventDetail.details.description = '{}'".format(description))
        assert event["EventDetail"]["details"]["description"] == description

    def test_time_filtering(self, helper):
        fred, freds_device = helper.given_new_user_with_device(self, "freddie")

        now = datetime.now(tz=timezone.utc)
        freds_device.record_event("playLure", {"lure-id": "possum_screech"}, [now])
        assert len(fred.can_see_events()) == 1

        sec = timedelta(seconds=1)

        # Window which covers event
        assert fred.can_see_events(startTime=now - sec, endTime=now + sec)

        # Window which doesn't cover event.
        assert not fred.can_see_events(startTime=now - (2 * sec), endTime=now - sec)

        # Just end time, before the event
        assert not fred.can_see_events(endTime=now - sec)

        # Just end time, after the event
        assert fred.can_see_events(endTime=now + sec)

        # Just start time, after the event
        assert not fred.can_see_events(startTime=now + sec)

        # Just start time, on the event
        assert fred.can_see_events(startTime=now)

    def test_event_filtering(self, helper):
        georgina, georgina_device = helper.given_new_user_with_device(self, "georgina")

        georgina_device.record_event("play-Lure", {"lure-id": "possum_screech"})
        georgina_device.record_event("software", {"recorder": "v1.3"})
        assert len(georgina.can_see_events()) == 2

        assert georgina.gets_first_event(type="software")["type"] == "software"

        assert georgina.gets_first_event(type="play-Lure")["type"] == "play-Lure"

    def test_latest_first(self, helper):
        lily, lily_device = helper.given_new_user_with_device(self, "lily")

        lily_device.record_event("first-event", {"lure-id": "possum_screech"})
        lily_device.record_event("second-event", {"recorder": "v1.3"})

        assert "first-event" == lily.gets_first_event()["type"]

        assert "second-event" == lily.gets_first_event(latest="true")["type"]
