import json
import requests
from urllib.parse import urljoin


class APIBase:     
    
    def __init__(self, logintype, baseurl, loginname, password='password'):
        self._baseurl = baseurl
        self._loginname = loginname
        self._logintype = logintype
        self._password = password

    def login(self):
        url = urljoin(self._baseurl, "/authenticate_" + self._logintype)
        response = requests.post(url, data=self._create_login_and_password_map())

        if response.status_code == 200:
            self._set_jwt_token(response)
        elif response.status_code == 422:
            raise ValueError("Could not log on as '{}'.  Please check {} name.".format(self._loginname, self._logintype))
        elif response.status_code == 401:
            raise ValueError("Could not log on as '{}'.  Please check password.".format(self._loginname))
        else:
            response.raise_for_status()

        return self

    def register_as_new(self, group = None):
        url = urljoin(self._baseurl, "/api/v1/{}s".format(self._logintype))
        data = self._create_login_and_password_map()

        if group:
            data['group'] = group

        response = requests.post(url, data=data)


        if response.status_code == 200:
            self._set_jwt_token(response)
        else:
            response.raise_for_status()

        return self


    def _create_login_and_password_map(self):
        nameProp = self._logintype + 'name'
        return {
                nameProp: self._loginname,
                'password': self._password
        }

    def _set_jwt_token(self, response):
        self._token = response.json().get('token')
        self._auth_header = {'Authorization': self._token}
    

    def _check_response(self, r):
        if r.status_code == 400:
            messages = r.json().get('messages', '')
            raise IOError("request failed ({}): {}".format(r.status_code, messages))
        r.raise_for_status()
        return r.json()

    def get_login_name(self):
        return self._loginname