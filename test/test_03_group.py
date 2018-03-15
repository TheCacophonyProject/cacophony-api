import pytest
from fixturetestapi import FixtureTestAPI


class TestGroup:

    def test_group_can_be_created_and_users_added_to_it(self):
        testapi = FixtureTestAPI()

        print("If a new user Clare", end='')
        clare = testapi.given_new_user(self, 'clare')

        print("   has a new group called 'clares group'", end='')
        claresGroup = testapi.make_unique_group_name(self, 'clares_group')
        clare.create_group(claresGroup)
        print("({})".format(claresGroup))

        print("  and there is a new device called 'Terminator' in this group", end='')
        terminator = testapi.given_new_device(self, 'Terminator', claresGroup)

        print("  which has uploaded a recording")
        terminator.upload_recording()

        print("  then Clare should see the recording")
        clare.can_see_recording_from(terminator)

        print("Given a Daniel is a new user", end='')
        daniel = testapi.given_new_user(self, 'daniel')

        print("  then Daniel shouldn't be able to see any recordings")
        daniel.cannot_see_any_recordings()

        # print("  and Daniel shouldn't be able to add himself to clare's group")
        # daniel.add_to_group(daniel, claresGroup)

        # print("When Clare adds Daniel to her group")
        # clare.add_to_group(daniel, claresGroup)

        # print("  then Daniel should see the recording from 'Terminator'")
        # clare.can_see_recording_from(terminator)
       





    