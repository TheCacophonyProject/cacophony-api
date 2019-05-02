import pytest

from test.testexception import AuthorizationError


class TestDeviceUsers:
    def test_can_assign_a_device_to_a_user_and_remove_them(self, helper):
        admin_user = helper.admin_user()

        description = "If a new device 'Sharer' has an CPTV file"
        sharer = helper.given_new_device(self, "Sharer", description=description)
        recording = sharer.has_recording()

        print("   and a new user 'Sylvia' is added as a device user")
        sylvia = helper.given_new_user(self, "Sylvia")
        admin_user.add_to_device(sylvia, sharer)

        print("Then Sylvia should see the recording from 'Sharer'")
        sylvia.can_see_recording_from(sharer)
        sylvia.can_download_correct_recording(recording)

        print("When 'Sylvia' is removed from the device")
        admin_user.remove_from_device(sylvia, sharer)

        print("Then Sylvia should no longer see any recordings")
        sylvia.cannot_see_recordings()
        sylvia.cannot_download_recording(recording)

    def test_user_cant_add_self_to_device(self, helper):
        description = "If a new device 'Shaper' has an CPTV file"
        shaper = helper.given_new_device(self, "Shaper", description=description)
        shaper.upload_recording()

        print("    and Jocelyn is a new user", end="")
        jocelyn = helper.given_new_user(self, "Jocelyn")

        print("Then Jocelyn shouldn't be able to add herself to the device")
        with pytest.raises(AuthorizationError):
            jocelyn.add_to_device(jocelyn, shaper)

    def test_user_cant_remove_person_from_device_unless_they_are_an_admin(self, helper):
        description = "If a new device 'Shaker' has an CPTV file"
        shaker = helper.given_new_device(self, "Shaker", description=description)

        print("    and admin is a user of this device", end="")
        helper.admin_user().add_to_device(helper.admin_user(), shaker)

        print("    and Violet is a new user", end="")
        violet = helper.given_new_user(self, "Violet")

        print("Then Violet shouldn't be able to remove admin from the device")
        with pytest.raises(AuthorizationError):
            violet.remove_from_device(helper.admin_user(), shaker)

    def test_can_list_device_users(self, helper):
        admin_user = helper.admin_user()

        # A new device has just the admin user as a group user.
        device = helper.given_new_device(self, "Zoe")
        admin_user.device_has_group_users(device, admin_user)
        admin_user.device_has_device_users(device)

        # Now add a user and see that it's reported.
        samantha = helper.given_new_user(self, "Samantha")
        admin_user.add_to_device(samantha, device)
        admin_user.device_has_device_users(device, samantha)

        # Now add a another device user and see that both users are reported.
        bobby = helper.given_new_user(self, "Bobby")
        admin_user.add_to_device(bobby, device)
        admin_user.device_has_device_users(device, samantha, bobby)

        # A new device has just the carrie user as a group user.
        carrie = helper.given_new_user(self, "Carrie")
        carrie_group = helper.make_unique_group_name(self, "carrie_group")
        carrie.create_group(carrie_group)
        carrie_device = helper.given_new_device(self, "Carrie", carrie_group)
        carrie.device_has_group_users(carrie_device, carrie)
        carrie.device_has_device_users(carrie_device)

        # check that zoe device still only has sam and bobby
        admin_user.device_has_device_users(device, samantha, bobby)

    def test_random_user_cant_list_group(self, helper):
        admin_user = helper.admin_user()

        # Set up a device with a group user (admin) and another user.
        device = helper.given_new_device(self, "sentinel")
        admin_user.add_to_device(helper.given_new_user(self, "Samantha"), device)

        # Ensure another user who is not a member of the group can't
        # list the users.
        hacker = helper.given_new_user(self, "Hacker")
        hacker.device_has_group_users(device)
        hacker.device_has_device_users(device)
