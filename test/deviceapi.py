import json
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

    def upload_recording(self, filename, props=None):
        if not props:
            props = {"type": "thermalRaw"}
        return self._upload('/api/v1/recordings', filename, props)

    def upload_audio_recording(self, filename, props=None):
        if not props:
            props = {}
        return self._upload('/api/v1/audiorecordings', filename, props)

    def _upload(self, url, filename, props):
        url = urljoin(self._baseurl, url)
        json_props = json.dumps(props)

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

    def record_event_data(self, eventData, times):
        eventData["dateTimes"] = times
        url = urljoin(self._baseurl, "/api/v1/events")
        response = requests.post(url, headers=self._auth_header, json=eventData)
        self._check_response(response)
        return (response.json()["eventsAdded"], response.json()["eventDetailId"])

    def record_event(self, _type, details, times=[datetime.utcnow().isoformat()]):
        return self.record_event_data({"description" : {"type": _type, "details": details}}, times)

    def record_event_from_id (self, eventDetailId, times=[datetime.utcnow().isoformat()]):
        return self.record_event_data({"eventDetailId": eventDetailId}, times)


