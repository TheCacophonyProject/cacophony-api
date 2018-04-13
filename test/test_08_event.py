import random
import string

class TestEvent:
    def test_can_create_new_event(self, helper):
        doer = helper.given_new_device(self, 'The Do-er')

        new_event = self._unique_event_name()

        sameDetails = doer.record_event(new_event, {"lure_id": "possum_screech"})

        sameDetailsToo = doer.record_event(new_event, {"lure_id": "possum_screech"}, "    and also")

        print('Then these events with the same details should use the same eventDetailId.')
        assert sameDetails == sameDetailsToo, 'And events with the same details should use the same eventDetailId'

        differentDetails = doer.record_event(new_event, {"lure_id": "possum_screech2"}, "Given this device also")

        print('Then the events with some different details should have different eventDetailIds.')
        assert sameDetails != differentDetails, "Events with different details should link to different eventDetailIds"

        differentDetails2 = doer.record_event(new_event, "", "Given this device also")

        print('Then the event with no details should should have a different eventDetailId.')
        assert sameDetails != differentDetails2, "Events with no details should link to different eventDetailId."

    def test_devices_share_events(self, helper):
        shaker = helper.given_new_device(self, 'The Shaker')
        new_event = self._unique_event_name()

        sameDetails = shaker.record_event(new_event, {"lure_id": "possum_screech"})

        print("    and ", end = "")
        actioner = helper.given_new_device(self, 'Actioner')

        sameDetailsDifferentDevice = actioner.record_event(new_event, {"lure_id": "possum_screech"})

        print('Then the devices should share the same eventDetailId.')
        assert sameDetails == sameDetailsDifferentDevice, "EventsDetails should be able to be linked to from different devices"

    def test_can_get_events(self, helper):
        (fred, freds_device) = helper.given_new_user_with_device(self, "freddie")

        # check there are no events on this device
        fred.cannot_see_events()

        freds_device.record_event("playLure", {"lure_id": "possum_screech"})

        print("Then 'freddie' should be able to see that the device has an event")
        assert (len(fred.can_see_events()) == 1)

        print("And super users should be able to see that the device has an event")
        assert (len(helper.admin_user().can_see_events(freds_device)) == 1)

        print("But a new user shouldn't see any device events")
        helper.given_new_user(self, 'grant').cannot_see_events()


    def test_should_be_able_top_upload_several_events_at_same_time(self, helper):
        rocker = helper.given_new_device(self, 'The Rocker')
        detailId = rocker.record_event("playLure", {"lure_id": "possum_screecher"})
        rocker.record_three_events_at_once(detailId)
        print("And super users should be able to see get all four events for the device")
        assert (len(helper.admin_user().can_see_events(rocker)) == 4)

    def test_get_event_attributes_returned(self, helper):
        boombox = helper.given_new_device(self, 'boombox')
        description = self._unique_event_name()
        detailId = boombox.record_event("audio-bait-played", {"lure_id": "possum_screams", 'description': description })
        event = helper.admin_user().can_see_events(boombox)[0]
        print("Then get events returns an event")
        print("    with DeviceId = '{}'".format(boombox.get_id()))
        assert (event['DeviceId'] == boombox.get_id())
        print("    and EventDetailId = '{}'".format(detailId))
        assert (event['EventDetailId'] == detailId)
        print("    and EventDetail.type = 'audio-bait-played'")
        assert (event['EventDetail']['type'] == "audio-bait-played")
        print("    and EventDetail.details.lure_id = 'possum_screems'")
        assert (event['EventDetail']['details']['lure_id'] == "possum_screams")
        print("    and EventDetail.details.description = '{}'".format(description))
        assert (event['EventDetail']['details']['description'] == description)

    def _unique_event_name(self):
        return "Event_" + "".join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))

