class TestEvent:
    def test_can_create_new_event(self, helper):
        doer = helper.given_new_device(self, 'The Do-er')

        (event1, sameDetails) = doer.record_event("EventTest_" + doer.devicename, {"lure_id": "possum_screech"})

        (event2, sameDetailsToo) = doer.record_event("EventTest_" + doer.devicename, {"lure_id": "possum_screech"})

        print('Then the events with the same details should use the same eventDetailId')
        assert sameDetails == sameDetailsToo, 'And events with the same details should use the same eventDetailId'

        (event3, differentDetails) = doer.record_event("EventTest_" + doer.devicename, {"lure_id": "possum_screech2"})

        print('Then events with some different details should have different eventDetailIds')
        assert sameDetails != differentDetails, "Events with different details should link to different eventDetailIds"

        (event3, differentDetails2) = doer.record_event("EventTest_" + doer.devicename, "")

        print('Then the event with no details should should have a different eventDetailId')
        assert sameDetails != differentDetails2, "Events with no details should link to different eventDetailId."

    def test_devices_share_events(self, helper):
        shaker = helper.given_new_device(self, 'The Shaker')

        (event1, sameDetails) = shaker.record_event("EventTest_" + shaker.devicename, {"lure_id": "possum_screech"})

        actioner = helper.given_new_device(self, 'Actioner')

        (event1, sameDetailsDifferentDevice) = actioner.record_event("EventTest_" + shaker.devicename, {"lure_id": "possum_screech"})

        print('Then the two devices should share an eventDetailId')
        assert sameDetails == sameDetailsDifferentDevice, "EventsDetails should be able to be linked to from different devices"
