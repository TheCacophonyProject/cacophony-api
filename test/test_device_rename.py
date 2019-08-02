import pytest

from test.testexception import AuthorizationError
from .deviceapi import DeviceAPI


class TestDeviceRename:
    def test_renaming_device(self, helper):
        admin_user = helper.admin_user()

        user1, device1 = helper.given_new_user_with_device(self, "indecisive_user")
        device1_old_name = device1.devicename
        device1_old_group = device1.group
        device1_password = device1._deviceapi._password

        device1_new_name = "new_name_" + helper.random_id()
        device1_new_group = helper.make_unique_group_name(self, "new_group")
        user1.create_group(device1_new_group)

        # should be able to rename to new group
        device1.rename(device1_new_name, device1_new_group)

        # should not error if not changing name or group
        device1.rename(device1_new_name, device1_new_group)

        # fail movign to a group that doesn't exist
        with pytest.raises(Exception):
            device1.rename(device1_new_name, helper.random_id())

        # fail loging in with old credentials
        with pytest.raises(Exception):
            helper.login_as_device(device1_old_name, device1_old_group, device1_password)

        # login with new credentials
        helper.login_as_device(device1_new_name, device1_new_group, device1_password)

        device2 = helper.given_new_device(self)

        # can't have same name and group as another device
        with pytest.raises(Exception):
            device2.rename(device1_new_name, device1_new_group)

        # can't rename with user token
        device2._deviceapi._auth_header = user1._userapi._auth_header
        with pytest.raises(Exception):
            device2.rename(helper.random_id(), device1_new_group)
