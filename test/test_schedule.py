import pytest
import time
import json

from test.testexception import AuthorizationError


class TestSchedule:
    def test_only_device_owners_can_set_schedule(self, helper):
        louie, louies_device = helper.given_new_user_with_device(self, "Louie")

        print("Then Louie should be able to set the audio schedule on his device.")
        louie.set_audio_schedule().for_device(louies_device)

        infilmator = helper.given_new_device(self, "in-film-ator")

        print("Then Louie cannot set the schedule this device.")
        with pytest.raises(AuthorizationError):
            louie.set_audio_schedule().for_device(infilmator)

        print("    or set schedules on both devices together.")
        with pytest.raises(AuthorizationError):
            louie.set_audio_schedule().for_devices(louies_device, infilmator)

        print("Administrators should be able to set the schedule on Louie's device.")
        helper.admin_user().set_audio_schedule().for_device(louies_device)

    def test_device_can_get_its_schedule_and_can_set_schedule_for_multiple_devices_at_once(
        self, helper
    ):
        rocker = helper.given_new_device(self, "rocker")
        rolla = helper.given_new_device(self, "rolla")

        print("    with an audio schedule that set on both devices together,")
        schedule = self.makeschedule(helper)
        helper.admin_user().set_audio_schedule(schedule=schedule).for_devices(
            rocker, rolla
        )

        print("Then both rocker and rolla can get their own schedule.")
        assert rocker.get_audio_schedule()["schedule"] == schedule
        assert rolla.get_audio_schedule()["schedule"] == schedule

        print("    and each should only see their device on the schedule.")
        assert rocker.get_audio_schedule()["devices"]["count"] == 1

    def test_user_can_get_device_schedule(self, helper):
        max, maxs_device = helper.given_new_user_with_device(self, "Max")

        print("    with an audio schedule")
        maxs_device_schedule = self.makeschedule(helper)
        max.set_audio_schedule(schedule=maxs_device_schedule).for_device(maxs_device)

        print("Then Max should be able to get schedule for the his device.")
        assert max.get_audio_schedule(maxs_device)["schedule"] == maxs_device_schedule

        hollerer = helper.given_new_device(self, "hollerer")
        print("    with an audio schedule")
        hollerer_schedule = self.makeschedule(helper)
        helper.admin_user().set_audio_schedule(schedule=hollerer_schedule).for_device(
            hollerer
        )

        print("Then Max should not be able to get audio schedule for the hollerer.")
        with pytest.raises(AuthorizationError):
            print(max.get_audio_schedule(hollerer)["schedule"])

        print("But an admin user should be able to.")
        assert (
            helper.admin_user().get_audio_schedule(hollerer)["schedule"]
            == hollerer_schedule
        )

    def test_get_schedule_returns_when_device_has_no_schedule(self, helper):
        quiet_one = helper.given_new_device(
            self,
            "quiet_one",
            description="If there is a device, quiet-one, without an audio schedule,",
        )

        print(
            "Then get schedule should return successfully, with an empty schedule ('{}')"
        )
        assert quiet_one.get_audio_schedule()["schedule"] == {}

    def test_get_schedule_returns_all_devices_for_user(self, helper):
        noel, noels_device = helper.given_new_user_with_device(self, "Noel")
        print("    and ", end="")
        beatbox = helper.given_new_device(self, "beatbox")

        print("    both with the same audio schedule")
        both_schedule = self.makeschedule(helper)
        helper.admin_user().set_audio_schedule(schedule=both_schedule).for_devices(
            noels_device, beatbox
        )

        print("Then admin should see both devices when getting the schedule")
        devices = json.dumps(helper.admin_user().get_audio_schedule(beatbox)["devices"])
        assert helper.admin_user().get_audio_schedule(beatbox)["devices"]["count"] == 2
        assert noels_device.devicename in devices
        assert beatbox.devicename in devices

        print("Then Noel should only see his device when getting the same schedule")
        assert noel.get_audio_schedule(noels_device)["devices"]["count"] == 1
        assert noels_device.devicename in devices

    def makeschedule(self, helper):
        return {"blah": helper.random_id()}
