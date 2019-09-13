import pytest

from test.testexception import AuthenticationError, UnprocessableError


class TestDeviceQuery:
    def test_query(self, helper):
        admin_user = helper.admin_user()
        clare = helper.given_new_user(self, "clare")
        clares_group = helper.make_unique_group_name(self, "clares_group")
        clare.create_group(clares_group)
        terminator = helper.given_new_device(self, "Terminator", clares_group)
        terminator2 = helper.given_new_device(self, "Terminator", clares_group)

        gary = helper.given_new_user(self, "gary")
        gary_group = helper.make_unique_group_name(self, "garys_group")
        gary.create_group(gary_group)
        gary_device = helper.given_new_device(self, "Gary_device", gary_group)

        devices = clare.query_devices(devices=[terminator])
        ids = set([device["id"] for device in devices])
        assert ids == set([terminator.get_id()])

        devices = clare.query_devices(devices=[terminator, terminator2])
        ids = set([device["id"] for device in devices])
        assert ids == set([terminator.get_id(), terminator2.get_id()])

        devices = clare.query_devices(groups=[clares_group])
        ids = set([device["id"] for device in devices])
        assert ids == set([terminator.get_id(), terminator2.get_id()])

        devices = clare.query_devices(groups=[gary_group])
        ids = set([device["id"] for device in devices])
        assert ids == set()

        devices = gary.query_devices(devices=[terminator], groups=[gary_group, clares_group])
        ids = set([device["id"] for device in devices])
        assert ids == set([gary_device.get_id()])

        devices = admin_user.query_devices(devices=[terminator], groups=[gary_group, clares_group])
        ids = set([device["id"] for device in devices])
        assert ids == set([terminator.get_id(), terminator2.get_id(), gary_device.get_id()])

    def test_access(self, helper):
        clare = helper.given_new_user(self, "clare")
        clares_group = helper.make_unique_group_name(self, "clares_group")
        clare.create_group(clares_group)
        terminator = helper.given_new_device(self, "Terminator", clares_group)
        terminator2 = helper.given_new_device(self, "Terminator", clares_group)
        terminator3 = helper.given_new_device(self, "Terminator", clares_group)
        access = {"devices": "r"}
        clare.new_token(access, set_token=True)
        devices = clare.query_devices(devices=[terminator, terminator2])
        ids = [device["id"] for device in devices]
        assert ids == [terminator.get_id(), terminator2.get_id()]
        new_group = helper.make_unique_group_name(self, "clares_group")
        with pytest.raises(AuthenticationError):
            clare.create_group(new_group)

        devices = clare.query_devices(
            devices=[terminator, terminator2], groups=[clares_group], operator="AND"
        )
        ids = [device["id"] for device in devices]
        assert ids == [terminator.get_id(), terminator2.get_id()]
        with pytest.raises(UnprocessableError):
            devices = clare.query_devices(devices=[terminator, terminator2], operator="in")
