import pytest


class TestDeviceRename:
    def test_renaming_device(self, helper):
        admin_user = helper.admin_user()

        user1, device1 = helper.given_new_user_with_device(self, "indecisive_user")
        device1_old_name = device1.devicename
        device1_old_group = device1.group
        device1_password = device1._deviceapi._password

        new_name = "new_name_" + helper.random_id()
        new_group = helper.make_unique_group_name(self, "new_group")
        new_password = helper.random_password()
        user1.create_group(new_group)

        # should error if not changing name or group
        with pytest.raises(Exception):
            device1.reregister(new_name, new_group)

        # fail moving to a group that doesn't exist
        with pytest.raises(Exception):
            device1.reregister(new_name, helper.random_id())

        # should be able to reregister to new group
        device1.reregister(new_name, new_group, new_password)

        # login with new credentials
        device1v2 = helper.login_as_device(new_name, new_group, new_password)

        # login with old credentials
        device1 = helper.login_as_device(device1_old_name, device1_old_group, device1_password)

        # get active devices for user
        active_devices = user1.get_active_devices()
        assert len(active_devices) == 1
        assert active_devices[0]["devicename"] == new_name

        device2 = helper.given_new_device(self)

        # can't have same name and group as another device
        with pytest.raises(Exception):
            device2.reregister(device1_new_name, device1_new_group, "password")

        # can't reregister with user token
        device2._deviceapi._auth_header = user1._userapi._auth_header
        with pytest.raises(Exception):
            device2.reregister(helper.random_id(), device1_new_group, "password")
