import pytest

from test.testexception import UnprocessableError


class TestDeviceGroupNames:
    def test_authentication(self, helper):
        clare = helper.given_new_user(self, "clare")
        clares_group = helper.make_unique_group_name(self, "clares_group")
        clare.create_group(clares_group)
        c_terminator = helper.given_new_device(self, "Terminator", clares_group, description=None)
        assert c_terminator.get_id() is not None

        helper.login_as_device(c_terminator.devicename, clares_group)
        helper.login_as_device(
            c_terminator.devicename.upper(),
            clares_group.upper(),
            password=helper._make_password(c_terminator.devicename),
        )
        helper.login_as_device(c_terminator.get_id(), None, helper._make_password(c_terminator.devicename))

        # can upload with device or device + group and with just unique device id
        recording = clare.uploads_recording_for(c_terminator)
        c_terminator.group = ""
        recording = clare.uploads_recording_for(c_terminator)
        recording = clare.uploads_recording_for(c_terminator, device_id=c_terminator.get_id())

        with pytest.raises(UnprocessableError):
            c_terminator = helper.given_new_device(
                None,
                "1234",
                clares_group,
                description="and devicename 1234 fails, for it must containt alpha char",
            )

    def test_unique_authentication(self, helper):
        clare = helper.given_new_user(self, "clare")
        clares_group = helper.make_unique_group_name(self, "clares_group")
        clare.create_group(clares_group)
        c_terminator = helper.given_new_device(self, "Terminator", clares_group, description=None)

        clares_second_group = helper.make_unique_group_name(self, "clares_group_2")
        clare.create_group(clares_second_group)

        c_terminator2 = helper.given_new_device(
            None, c_terminator.devicename, clares_second_group, description=None
        )
        with pytest.raises(ValueError):
            helper.login_as_device(c_terminator.devicename, None)

        device = helper.login_as_device(c_terminator.devicename, clares_group)
        device2 = helper.login_as_device(c_terminator2.devicename, clares_second_group)
        assert device != device2

        helper.login_as_device(c_terminator.get_id(), None, helper._make_password(c_terminator.devicename))

    # Now in cypress - but not running on server yet
    def test_unique_names(self, helper):
        print("If a new user Clare", end="")
        clare = helper.given_new_user(self, "clare")

        print("   has a new group called 'clares group'", end="")
        clares_group = helper.make_unique_group_name(self, "clares_group")
        clare.create_group(clares_group)
        print("({})".format(clares_group))

        description = "  and there is a new device called 'Terminator' in this group"
        c_terminator = helper.given_new_device(self, "Terminator", clares_group, description=description)

        recording = c_terminator.has_recording()
        with pytest.raises(UnprocessableError):
            description = "  clare can't make another 'Terminator' of any case in this group\n"
            helper.given_new_device(None, c_terminator.devicename, clares_group, description=description)
            helper.given_new_device(
                None, c_terminator.devicename.lower(), clares_group, description=description
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

        with pytest.raises(UnprocessableError):
            print("pat can't make another '{}' group\n".format(pats_group))
            pat.create_group(pats_group)
