import pytest

class TestSchedule:
    def test_only_device_owners_can_set_scedule(self, helper):
        louie, louies_device = helper.given_new_user_with_device(self, "Louie")

        print("Then Louie should be able to set the audio schedule on his device.")
        louie.set_audio_schedule().for_device(louies_device)

        print("But other users should not be able to set the schedule on Louie's device.")
        with pytest.raises(OSError, message="Other user should not have permissions to set schedule on the device."):
            helper.given_new_user(self, 'Pther user').set_audio_schedule().for_device(louies_device)

        print("Administrators should also be able to set the schedule on Louie's device.")
        helper.admin_user().set_audio_schedule().for_device(louies_device)
