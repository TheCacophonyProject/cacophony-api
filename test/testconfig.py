import json
from pathlib import Path
from testexception import TestException

class TestConfig: 

    def __init__(self, 
                api_server = 'http://127.0.0.1:1080',
                admin_username = 'admin_test',
                admin_password = 'admin_test', 
                default_group = 'test-group'):
        self.api_server = api_server
        self.admin_username = admin_username
        self.admin_password = admin_password
        self.default_group = default_group

    def load_config(self): 
        config_file = 'testconfig.json'

        if not Path(config_file).is_file():
            print("No config file '{}'.  Running with default config.".format(config_file))
            return self
        
        with open(config_file) as json_data_file:
            print("Attempting to load config from file '{}'...".format(config_file))
            data = json.load(json_data_file)
            return TestConfig(**data)                  
