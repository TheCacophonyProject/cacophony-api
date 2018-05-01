import pytest

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
