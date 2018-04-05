import os
import json
from urllib.parse import urljoin
from datetime import datetime

import requests
from requests_toolbelt.multipart.encoder import MultipartEncoder

from .apibase import APIBase


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
        self._check_response(r)
        return r.json()['recordingId']

    def record_event_data(self, eventData):
        eventData["eventDateTimes"] = [datetime.utcnow().isoformat()]
        url = urljoin(self._baseurl, "/api/v1/events")
        response = requests.post(url, headers=self._auth_header, json=eventData)
        self._check_response(response)
        return (response.json()["eventsAdded"], response.json()["eventDetailId"])

    def record_event(self, _type, details):
        return self.record_event_data({"type": _type, "details": details})

    def record_event_from_id (self, eventDetailId):
        return self.record_event_data({"eventDetailId": eventDetailId})


