import pytest
import time

class TestSchedule:
    def test_only_device_owners_can_set_scedule(self, helper):
        louie, louies_device = helper.given_new_user_with_device(self, "Louie")

        print("Then Louie should be able to set the audio schedule on his device.")
        louie.set_audio_schedule().for_device(louies_device)

        infilmator = helper.given_new_device(self, "in-film-ator")

        print("Then Louie cannot set the schedule this device.")
        with pytest.raises(OSError, message="Louie should not have permissions to set schedule on this device."):
            louie.set_audio_schedule().for_device(infilmator)

        print("    or set schedules on both devices together.")
        with pytest.raises(OSError, message="Louie should not have permissions to set schedule on this device."):
            louie.set_audio_schedule().for_devices(louies_device, infilmator)

        print("Administrators should be able to set the schedule on Louie's device.")
        helper.admin_user().set_audio_schedule().for_device(louies_device)

    def test_device_can_get_its_schedule(self, helper):
        rocker = helper.given_new_device(self, "rocker")
        rolla = helper.given_new_device(self, "rolla")

        helper.admin_user().set_audio_schedule().for_devices(rocker, rolla)

        print(rocker.get_audio_schedule())
        print(rolla.get_audio_schedule())

    def test_user_can_get_device_schedule(self, helper):
        max, maxs_device = helper.given_new_user_with_device(self, "Max")

        print("    with an audio schedule")
        max.set_audio_schedule().for_device(maxs_device)

        print("Then Max should be able to get schedule for the his device.")
        print(max.get_audio_schedule(maxs_device))

        hollerer = helper.given_new_device(self, "hollerer")
        print("    with an audio schedule")
        helper.admin_user().set_audio_schedule().for_device(hollerer)

        print("Then Max should not be able to get audio schedule for the hollerer.")
        with pytest.raises(OSError, message="Max should not have permissions to set schedule on this device."):
            print(max.get_audio_schedule(hollerer))

        print("But an admin user should be able to")
        print(helper.admin_user().get_audio_schedule(hollerer))
