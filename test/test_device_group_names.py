import pytest

from test.testexception import UnprocessableError


class TestDeviceGroupNames:
    def test_unique_names(self, helper):
        print("If a new user Clare", end="")
        clare = helper.given_new_user(self, "clare")

        print("   has a new group called 'clares group'", end="")
        clares_group = helper.make_unique_group_name(self, "clares_group")
        clare.create_group(clares_group)
        print("({})".format(clares_group))

        description = "  and there is a new device called 'Terminator' in this group"
        c_terminator = helper.given_new_device(
            self, "Terminator", clares_group, description=description
        )

        recording = c_terminator.has_recording()
        return
        with pytest.raises(UnprocessableError):
            description = "  clare can't make another 'Terminator' in this group\n"
            helper.given_new_device(
                None, c_terminator.devicename, clares_group, description=description
            )

        print("If a new user Pat", end="")
        pat = helper.given_new_user(self, "Pat")

        print("   has a new group called 'pats group'", end="")
        pats_group = helper.make_unique_group_name(self, "pats_group")
        pat.create_group(pats_group)
        print("({})".format(pats_group))

        description = f" there can also be a device called '{c_terminator.devicename}' in this group"
        p_terminator = helper.given_new_device(
            None, c_terminator.devicename, pats_group, description=description
        )

        devices = pat.get_devices_as_ids()
        assert devices == [p_terminator.get_id()]
        devices = clare.get_devices_as_ids()
        assert devices == [c_terminator.get_id()]

        admin = helper.admin_user()
        devices = admin.get_devices_as_ids()
        print(devices)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(c_terminator.devicename, clares_group)
