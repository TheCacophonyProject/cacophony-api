import random
import string
from datetime import date

from .userapi import UserAPI
from .deviceapi import DeviceAPI
from .testuser import TestUser
from .testdevice import TestDevice
from .testconfig import TestConfig
from .testexception import TestException, UnprocessableError


class Helper:
    def __init__(self):
        self.config = TestConfig().load_config()
        self._admin = None
        self._check_admin_and_group_exist()

    def login_as(self, username):
        password = self._make_password(username)
        api = UserAPI(self.config.api_url, username, None, password).login()
        return TestUser(username, api)

    def login_with_email(self, username, email):
        password = self._make_password(username)
        api = UserAPI(self.config.api_url, username, email, password).login()
        return TestUser(username, api, email)

    def login_with_name_or_email(self, username, nameOrEmail):
        password = self._make_password(username)
        api = UserAPI(self.config.api_url, username, None, password)
        api.name_or_email_login(nameOrEmail)
        return TestUser(username, api)

    def login_as_device(self, devicename):
        password = self._make_password(devicename)
        device = DeviceAPI(self.config.api_url, devicename, password).login()
        return TestDevice(devicename, device, self)

    def given_new_user_with_device(self, testClass, username_base):
        self._print_description("Given a new user {}".format(username_base))
        user = self.given_new_user(testClass, username_base)
        devicename = user.username + "s_device"
        device = self.given_new_device(
            None,
            devicename,
            group=user.get_own_group(),
            description="    with a device",
        )
        return (user, device)

    def given_new_user(self, testClass, username, email=None):
        if not email:
            email = username + "@email.com"
        basename = self._make_long_name(testClass, username)
        testname = basename
        baseemail = self._make_long_email(testClass, email)
        testemail = baseemail
        for num in range(2, 200):
            try:
                api = UserAPI(
                    self.config.api_url,
                    testname,
                    testemail,
                    self._make_password(testname),
                ).register_as_new()
                self._print_actual_name(testname)
                return TestUser(testname, api, testemail)
            except UnprocessableError:
                pass  # expected
            testname = "{}{}".format(basename, num)
            testemail = "{}{}".format(num, baseemail)

        raise TestException("Could not create username like '{}'".format(basename))

    def given_new_fixed_user(self, username, email=None):
        if not email:
            email = username + "@email.com"
        api = UserAPI(
            self.config.api_url,
            username,
            email,
            self._make_password(username),
        ).register_as_new()
        self._print_actual_name(username)
        return TestUser(username, api, email)

    def _make_unique_name(self, testClass, name, usednames):
        if testClass is not None:
            basename = self._make_long_name(testClass, name)
        else:
            basename = name
        testname = basename

        for num in range(2, 1000):
            if '"{}"'.format(testname) not in usednames:
                return testname
            testname = "{}{}".format(basename, num)

    def make_unique_group_name(self, testClass, groupName):
        groups = self._get_admin().get_groups_as_string()
        return self._make_unique_name(testClass, groupName, groups)

    def given_new_device(
        self, testClass, devicename=None, group=None, description=None
    ):
        if not devicename:
            devicename = "random-device"

        if not description:
            description = "Given a new device '{}'".format(devicename)
        self._print_description(description)

        if testClass is not None:
            devices = self._get_admin().get_devices_as_string()
            uniqueName = self._make_unique_name(testClass, devicename, devices)
        else:
            uniqueName = devicename

        if not group:
            group = self.config.default_group

        try:
            device = DeviceAPI(
                self.config.api_url, uniqueName, self._make_password(uniqueName)
            ).register_as_new(group)
            self._print_actual_name(uniqueName)
            return TestDevice(uniqueName, device, self)
        except Exception as exception:
            raise TestException("Failed to create device: {}".format(exception))

    def given_a_recording(self, testClass, devicename=None, group=None):
        device = self.given_new_device(testClass, devicename=devicename, group=group)
        return device.has_recording()

    def _make_long_name(self, testClass, name):
        testName = type(testClass).__name__
        if testName[:4] == "Test":
            testName = testName[4:]
        return "{}_{}_{}".format(testName, name, date.today().strftime("%m%d"))

    def _make_long_email(self, testClass, email):
        testName = type(testClass).__name__
        if testName[:4] == "Test":
            testName = testName[4:]
        return "{}_{}_{}".format(date.today().strftime("%m%d"), testName, email)

    def _make_password(self, loginname):
        return "p{}".format(loginname)

    def admin_user(self):
        return TestUser(self.config.admin_username, self._get_admin())

    def _get_admin(self):
        if not self._admin:
            print("Logging on as Admin once")
            self._admin = UserAPI(
                self.config.api_url,
                self.config.admin_username,
                self.config.admin_email,
                self.config.admin_password,
            ).login()
        return self._admin

    def _print_actual_name(self, name):
        print("  ({})".format(name))

    def _print_description(self, description):
        print(description, end="")

    def _check_admin_and_group_exist(self):
        allGroups = self._get_admin().get_groups_as_string()
        default_group = self.config.default_group
        if '"{}"'.format(default_group) not in allGroups:
            print("Creating default group")
            self.admin_user().create_group(default_group)

    def random_id(self, length=6):
        return "".join(
            random.choice(string.ascii_uppercase + string.digits) for _ in range(length)
        )
