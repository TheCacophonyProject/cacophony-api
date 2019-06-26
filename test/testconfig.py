import json
from pathlib import Path

import attr

CONFIG_FILE = "testconfig.json"


@attr.s
class TestConfig:
    api_url = attr.ib(default="http://127.0.0.1:1080")
    admin_username = attr.ib(default="admin_test")
    admin_password = attr.ib(default="admin_test")
    admin_email = attr.ib(default="admin@email.com")
    default_group = attr.ib(default="test-group")
    fileprocessing_url = attr.ib(default="http://127.0.0.1:2008")

    def load_config(self):
        if not Path(CONFIG_FILE).is_file():
            print("No config file '{}'.  Running with default config.".format(CONFIG_FILE))
            return self

        print("Attempting to load config from file '{}'...".format(CONFIG_FILE))
        with open(CONFIG_FILE) as f:
            return TestConfig(**json.load(f))
