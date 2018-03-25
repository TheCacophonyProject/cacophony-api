import pytest
from helper import Helper

class TestGroup:

    def test_group_can_be_created_and_users_added_to_it(self):
        helper = Helper()

        print("If a new user Clare", end='')
        clare = helper.given_new_user(self, 'clare')

        print("   has a new group called 'clares group'", end='')
        claresGroup = helper.make_unique_group_name(self, 'clares_group')
        clare.create_group(claresGroup)
        print("({})".format(claresGroup))

        description = "  and there is a new device called 'Terminator' in this group"
        terminator = helper.given_new_device(self, 'Terminator', claresGroup, description=description)

        print("  which has uploaded a recording", end='')
        recording = terminator.upload_recording()

        print("  then Clare should see the recording")
        clare.can_see_recordings(recording)

        print("Given a Daniel is a new user", end='')
        daniel = helper.given_new_user(self, 'daniel')

        print("  then Daniel shouldn't be able to see any recordings")
        daniel.cannot_see_any_recordings()

        # print("  and Daniel shouldn't be able to add himself to clare's group")
        # daniel.add_to_group(daniel, claresGroup)

        # print("When Clare adds Daniel to her group")
        # clare.add_to_group(daniel, claresGroup)

        # print("  then Daniel should see the recording from 'Terminator'")
        # clare.can_see_recording_from(terminator)






