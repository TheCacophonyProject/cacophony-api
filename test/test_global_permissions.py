import pytest

from test.testexception import AuthorizationError


class TestGlobalPermission:
    def test_setting_global_permissions(self, helper):
        print("Given new users Tom and bob")
        tom = helper.given_new_user(self, "tom")
        bob = helper.given_new_user(self, "bob")

        print("  Tom shoud not be able to change global permissions for himself")
        with pytest.raises(AuthorizationError):
            tom.set_global_permission(tom.username, "write")

        print("  Or other users (bob)")
        with pytest.raises(AuthorizationError):
            tom.set_global_permission(bob.username, "write")

        print("When Tom is given global read permission")
        admin = helper.admin_user()
        admin.set_global_permission(tom.username, "read")

        print(" he should still not be able to change global permissions for himself")
        with pytest.raises(AuthorizationError):
            tom.set_global_permission(tom.username, "write")

        print("  Or other users (bob)")
        with pytest.raises(AuthorizationError):
            tom.set_global_permission(bob.username, "write")

        print("When Tom is given global write permission")
        admin.set_global_permission(tom.username, "write")

        print("  he should be able to change global permissions")
        tom.set_global_permission(bob.username, "write")
        tom.set_global_permission(bob.username, "read")
        tom.set_global_permission(bob.username, "off")

    def test_global_permission_on_recording(self, helper):
        print("If a new user John signs up", end="")
        john = helper.given_new_user(self, "john")

        print("  has a new group called 'johns group'", end="")
        johnsGroup = helper.make_unique_group_name(self, "johns_group")
        john.create_group(johnsGroup)
        print("({})".format(johnsGroup))

        description = "  and there is a new device called 'johnsDevice' in this group"
        johnsDevice = helper.given_new_device(
            self, "johnsDevice", johnsGroup, description=description
        )

        print("  which has uploaded a recording", end="")
        recording = johnsDevice.upload_recording()

        print("  then John should see the recording")
        john.can_see_recordings(recording)

        print("Given a new user Fred", end="")
        fred = helper.given_new_user(self, "fred")

        print("  then Fred shouldn't be able to see any recordings")
        fred.cannot_see_any_recordings()

        print("When Fred is given global read permission.")
        admin = helper.admin_user()
        admin.set_global_permission(fred.username, "read")

        print("  Fred should be able to see the recording")
        fred.can_see_recordings(recording)

        print("  But not delete the recording")
        with pytest.raises(AuthorizationError):
            fred.delete_recording(recording)

        print("  Or update the recording")
        with pytest.raises(AuthorizationError):
            fred.update_recording(recording, comment="testing")

        print("  Or tag the recording")
        with pytest.raises(AuthorizationError):
            fred.tag_recording(recording, {})

        print("When Fred is given global write permission")
        admin.set_global_permission(fred.username, "write")

        print("  Fred should be able to see the recording")
        fred.can_see_recordings(recording)

        print("  And update the recording")
        fred.update_recording(recording, comment="testing")

        print("  And tag the recording")
        fred.tag_recording(recording, {"animal": "cat"})

        print("  And delete the recording")
        fred.delete_recording(recording)
