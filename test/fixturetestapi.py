from userapi import UserAPI
from deviceapi import DeviceAPI
from datetime import date
from testuser import TestUser
from testdevice import TestDevice
from testconfig import TestConfig
from testexception import TestException

class FixtureTestAPI:

    def __init__(self):
        self.config = TestConfig().load_config()
        self._admin = None


    def login_as(self, username):
        password = self._make_password(username)
        api = UserAPI(self.config.api_server, username, password).login()
        return TestUser(username, api)

    def login_as_device(self, devicename):
        password = self._make_password(devicename)
        device = DeviceAPI(self.config.api_server, devicename, password).login()
        return TestDevice(devicename, device)

    def given_new_user(self, testClass, username):
        basename = self._make_long_name(testClass, username)
        testname = basename
        for num in range(2,200): 
            try:
                api = UserAPI(self.config.api_server, testname, self._make_password(testname)).register_as_new()
                self._print_actual_name(testname)
                return TestUser(testname, api)
            except Exception:
                pass
            testname = "{}{}".format(basename, num)
        
        raise TestException("Could not create username like '{}'".format(basename))

    def _make_unique_name(self, testClass, name, usednames): 
        basename = self._make_long_name(testClass, name)
        testname = basename

        for num in range(2,100): 
            if ('"{}"'.format(testname) not in usednames):
                return testname
            testname = "{}{}".format(basename, num)
        

    def make_unique_group_name(self, testClass, groupName): 
        groups = self._get_admin().get_groups_as_string()
        return self._make_unique_name(testClass, groupName, groups)
        

    def given_new_device(self, testClass, devicename, group=None):
        devices = self._get_admin().get_devices_as_string()
        uniqueName = self._make_unique_name(testClass, devicename, devices)
        print(uniqueName)

        if not group:
            group = self.config.default_group

        device = DeviceAPI(self.config.api_server, uniqueName, self._make_password(uniqueName)).register_as_new(group)
        self._print_actual_name(uniqueName)
        return TestDevice(uniqueName, device)

    def _make_long_name(self, testClass, name):
        return "{}_{}_{}".format(date.today().__format__('%d%m'), type(testClass).__name__, name)
    
    def _make_password(self, loginname):
        return "p{}".format(loginname)

    def admin_user(self):
        return TestUser(self.config.admin_username, self._get_admin())

    def _get_admin(self):
        if not self._admin:
            self._admin = UserAPI(self.config.api_server, self.config.admin_username, self.config.admin_password).login()
        return self._admin

    def _print_actual_name(self, name):
        print("  ({})".format(name))


