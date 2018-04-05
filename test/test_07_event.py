class TestEvent:
    def test_can_create_new_event(self, helper):
        doer = helper.given_new_device(self, 'The Do-er')

        sameDetails = doer.record_event("EventTest_" + doer.devicename, {"lure_id": "possum_screech"})

        sameDetailsToo = doer.record_event("EventTest_" + doer.devicename, {"lure_id": "possum_screech"}, "    and also")

        print('Then these events with the same details should use the same eventDetailId.')
        assert sameDetails == sameDetailsToo, 'And events with the same details should use the same eventDetailId'

        differentDetails = doer.record_event("EventTest_" + doer.devicename, {"lure_id": "possum_screech2"}, "Given this device also")

        print('Then the events with some different details should have different eventDetailIds.')
        assert sameDetails != differentDetails, "Events with different details should link to different eventDetailIds"

        differentDetails2 = doer.record_event("EventTest_" + doer.devicename, "", "Given this device also")

        print('Then the event with no details should should have a different eventDetailId.')
        assert sameDetails != differentDetails2, "Events with no details should link to different eventDetailId."

    def test_devices_share_events(self, helper):
        shaker = helper.given_new_device(self, 'The Shaker')

        sameDetails = shaker.record_event("EventTest_" + shaker.devicename, {"lure_id": "possum_screech"})

        print("    and ", end = "")
        actioner = helper.given_new_device(self, 'Actioner')

        sameDetailsDifferentDevice = actioner.record_event("EventTest_" + shaker.devicename, {"lure_id": "possum_screech"})

        print('Then the devices should share the same eventDetailId.')
        assert sameDetails == sameDetailsDifferentDevice, "EventsDetails should be able to be linked to from different devices"

    def test_should_be_able_top_upload_many_events_at_same_time(self, helper):
        rocker = helper.given_new_device(self, 'The Rocker')

        detailId = rocker.record_event("playLure", {"lure_id": "possum_screecher"})

        rocker.record_three_events_at_once(detailId)
