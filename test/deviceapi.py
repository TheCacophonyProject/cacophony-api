from apibase import APIBase

import json
import requests
from urllib.parse import urljoin
from requests_toolbelt.multipart.encoder import MultipartEncoder

class DeviceAPI(APIBase):

    def __init__(self, baseurl, devicename, password='password'):
        super().__init__('device', baseurl, devicename, password)

    def upload_recording(self, filename, jsonProps = None): 
        url = urljoin(self._baseurl, '/api/v1/recordings')

        if (jsonProps is None):
            jsonProps = '{"type": "thermalRaw"}'
            print (' null props')

        with open(filename, 'rb') as thermalfile: 
            multipart_data = MultipartEncoder(
                fields={
                        # a file upload field
                        'file': ('file.py', thermalfile),
                        # plain text fields
                        'data': jsonProps 
                    }
                )
            headers={'Content-Type': multipart_data.content_type, 'Authorization': self._token}
            r = requests.post(url, data=multipart_data, headers=headers)
        self._check_response(r)
        return r.json()['recordingId']




    

