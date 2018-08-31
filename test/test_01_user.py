class TestUser:
    def test_can_create_new_user(self, helper):
        print("If a new user Bob signs up", end='')
        bob = helper.given_new_user(self, 'bob')

        print("Then Bob should able to log in")
        bob_login = helper.login_as(bob.username)

        print('And Bob should be able to see his details include user id. ')
        helper.admin_user().get_user_details(helper.admin_user())
        bob.get_user_details(bob)
        bobUserDetails = bob.get_user_details(helper.admin_user())

        print("Bob's user id is {}".format(bobUserDetails))

        print("If a new user Fred signs up", end='')
        fred = helper.given_new_user(self, 'fred')

        print("Then Fred should able to log in using his email")
        fred_login = helper.login_with_email(fred.username, fred.email)

        print('And Fred should be able to see his details include user id. ')
        helper.admin_user().get_user_details(helper.admin_user())
        fred.get_user_details(fred)
        fredUserDetails = fred.get_user_details(helper.admin_user())

        print("Fred's user id is {}".format(fredUserDetails))
