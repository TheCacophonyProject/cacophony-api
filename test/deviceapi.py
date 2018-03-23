import os
from urllib.parse import urljoin

import requests
from requests_toolbelt.multipart.encoder import MultipartEncoder

from apibase import APIBase


class DeviceAPI(APIBase):
    def __init__(self, baseurl, devicename, password='password'):
        super().__init__('device', baseurl, devicename, password)

    def upload_recording(self, filename, json_props='{"type": "thermalRaw"}'):
        return self._upload('/api/v1/recordings', filename, json_props)

    def upload_audio_recording(self, filename, json_props='{}'):
        return self._upload('/api/v1/audiorecordings', filename, json_props)

    def _upload(self, url, filename, json_props):
        url = urljoin(self._baseurl, url)

        if json_props is None:
            json_props = '{}'

        with open(filename, 'rb') as content:
            multipart_data = MultipartEncoder(
                fields={
                    'data': json_props,
                    'file': (os.path.basename(filename), content),
                })
            headers = {
                'Content-Type': multipart_data.content_type,
                'Authorization': self._token
            }
            r = requests.post(url, data=multipart_data, headers=headers)

        return self._check_response(r)
