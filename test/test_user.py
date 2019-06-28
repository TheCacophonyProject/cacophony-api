import json
from random import choice
from string import ascii_uppercase

import pytest

from .testexception import UnprocessableError


MIN_USERNAME_LENGTH = 3
MIN_PASSWORD_LENGTH = 8


def _random_string_of_length(length):
    return "".join(choice(ascii_uppercase) for _ in range(length))


class TestUser:
    def test_can_create_new_user(self, helper):
        print("If a new user Bob signs up", end="")
        bob = helper.given_new_user(self, "bob")

        print("Then Bob should able to log in with his username in 'username' API field")
        helper.login_as(bob.username)

        print("And Bob should able to log in with his username in 'emailOrUsername' API field")
        helper.login_with_name_or_email(bob.username, bob.username)

        print("And Bob should able to log in with his email in 'email' API field")
        helper.login_with_email(bob.username, bob.email)

        print("And Bob should able to log in with his email in 'emailOrUsername' API field")
        helper.login_with_name_or_email(bob.username, bob.email)

        print("And Bob should be able to see his details include user id. ")
        helper.admin_user().get_user_details(helper.admin_user())
        bobs_user_details = bob.get_user_details(bob)
        assert bobs_user_details["userData"]["id"]
        admins_user_details = bob.get_user_details(helper.admin_user())
        assert admins_user_details["userData"]["id"]

        print("Bob's user id is {}".format(bobs_user_details["userData"]["id"]))

    def test_create_duplicate_user(self, helper):
        # Ensure the user exists
        try:
            print("If a user DuplicateBob signs up")
            helper.given_new_fixed_user("DuplicateBob")
        except UnprocessableError:
            pass  # expected

        # Now try to create the same user again
        with pytest.raises(UnprocessableError) as excinfo:
            print("DuplicateBob should not get created multiple times and returns a 422 error message")
            helper.given_new_fixed_user("DuplicateBob")
        error_string = str(excinfo.value)
        print("There should be a JSON object in the error message that can be parsed")
        parsed_json = json.loads(error_string)
        assert parsed_json["errorType"] == "validation"
        assert "'Username in use" in parsed_json["message"] or "Email in use" in parsed_json["message"]

    def test_register_username_password_length_requirements(self, helper):
        short_username = _random_string_of_length(MIN_USERNAME_LENGTH - 1)
        long_username = _random_string_of_length(MIN_PASSWORD_LENGTH)
        short_password = _random_string_of_length(MIN_PASSWORD_LENGTH - 1)
        long_password = _random_string_of_length(MIN_PASSWORD_LENGTH)

        with pytest.raises(UnprocessableError):
            print("When I try to register with a short username it should return an error")
            helper.given_new_fixed_user(username=short_username)

        with pytest.raises(UnprocessableError):
            print("When I try to register with a short password it should return an error")
            helper.given_new_fixed_user(username=long_username, password=short_password)

        print("When I try to register with a long enough username and password it should be successful")
        user = helper.given_new_fixed_user(username=long_username, password=long_password)
        assert user

    def test_patch_username_password_length_requirements(self, helper):
        user = helper.given_new_user(self, "asa")
        helper.login_as(user.username)
        short_username = _random_string_of_length(MIN_USERNAME_LENGTH - 1)
        long_username = _random_string_of_length(MIN_USERNAME_LENGTH)
        short_password = _random_string_of_length(MIN_PASSWORD_LENGTH - 1)
        long_password = _random_string_of_length(MIN_PASSWORD_LENGTH)

        with pytest.raises(UnprocessableError):
            print("When I try to patch to a short username it should return an error")
            user.update(username=short_username)

        with pytest.raises(UnprocessableError):
            print("When I try to patch to a short password it should return an error")
            user.update(password=short_password)

        print("When I try to patch to a long enough username and password it should be successful")
        user.update(username=long_username, password=long_password)
        print("  Then when I then try to login using the newly changed data, it should also be successful")
        helper.login_with_username_password(long_username, long_password)
