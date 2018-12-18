import pytest


class TestDeviceUsers:
    def test_can_assign_a_device_to_a_user_and_remove_them(self, helper):
        description = "If a new device 'Sharer' has an CPTV file"
        sharer = helper.given_new_device(self, "Sharer", description=description)
        sharer.upload_recording()

        print("   and a new user 'Sylvia' is added as a device user")
        sylvia = helper.given_new_user(self, "Sylvia")
        helper.admin_user().add_to_device(sylvia, sharer)

        print("Then Sylvia should see the recording from 'Sharer'")
        sylvia.can_see_recording_from(sharer)

        print("When 'Sylvia' is removed from the device")
        helper.admin_user().remove_from_device(sylvia, sharer)

        print("Then Sylvia should no longer see any recordings")
        sylvia.cannot_see_recordings()

    def test_user_cant_add_self_to_device(self, helper):
        description = "If a new device 'Shaper' has an CPTV file"
        shaper = helper.given_new_device(self, "Shaper", description=description)
        shaper.upload_recording()

        print("    and Jocelyn is a new user", end="")
        jocelyn = helper.given_new_user(self, "Jocelyn")

        print("Then Jocelyn shouldn't be able to add herself to the device")
        with pytest.raises(OSError, message=["Expected failed to add user to device."]):
            jocelyn.add_to_device(jocelyn, shaper)

    def test_user_cant_remove_person_from_device_unless_they_are_an_admin(self, helper):
        description = "If a new device 'Shaker' has an CPTV file"
        shaker = helper.given_new_device(self, "Shaker", description=description)

        print("    and admin is a user of this device", end="")
        helper.admin_user().add_to_device(helper.admin_user(), shaker)

        print("    and Violet is a new user", end="")
        violet = helper.given_new_user(self, "Violet")

        print("Then Violet shouldn't be able to remove admin from the device")
        with pytest.raises(
            OSError, message=["Expected failed to remove user from device."]
        ):
            violet.remove_from_device(helper.admin_user(), shaker)
