import pytest

from test.testexception import AuthorizationError


class TestGroup:
    def test_group_can_be_created_and_users_added_to_it_and_removed_from_it(
        self, helper
    ):
        print("If a new user Clare", end="")
        clare = helper.given_new_user(self, "clare")

        print("   has a new group called 'clares group'", end="")
        claresGroup = helper.make_unique_group_name(self, "clares_group")
        clare.create_group(claresGroup)
        print("({})".format(claresGroup))

        description = "  and there is a new device called 'Terminator' in this group"
        terminator = helper.given_new_device(
            self, "Terminator", claresGroup, description=description
        )

        print("  which has uploaded a recording", end="")
        recording = terminator.upload_recording()

        print("  then Clare should see the recording")
        clare.can_see_recordings(recording)

        print("Given a Daniel is a new user", end="")
        daniel = helper.given_new_user(self, "daniel")

        print("When Clare adds Daniel to her group")
        clare.add_to_group(daniel, claresGroup)

        print("  then Daniel should see the recording from 'Terminator'")
        daniel.can_see_recording_from(terminator)

        print("When Clare removes Daniel to her group")
        clare.remove_from_group(daniel, claresGroup)

        print("  then Daniel should no longer see any recordings")
        daniel.cannot_see_recordings()

    def test_user_cant_add_self_to_group(self, helper):

        print("Given a Robert is a new user", end="")
        robert = helper.given_new_user(self, "robert")

        print("Then Robert shouldn't be able to add himself to default group belonged to the admin")
        with pytest.raises(AuthorizationError):
            robert.add_to_group(robert, helper.config.default_group)

    def test_user_cant_remove_person_from_group_unless_they_are_an_admin(self, helper):

        print("Given a Steve is a new user", end="")
        steve = helper.given_new_user(self, "steve")

        print("Then Steve shouldn't be able to remove the admin from a group he is not an admin for")
        with pytest.raises(AuthorizationError):
            steve.remove_from_group(helper.admin_user(), helper.config.default_group)
