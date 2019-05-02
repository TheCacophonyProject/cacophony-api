from urllib.parse import urljoin
from datetime import datetime

import requests

from .apibase import APIBase


class DeviceAPI(APIBase):
    def __init__(self, baseurl, devicename, password="password"):
        super().__init__("device", baseurl, devicename, password)

    def upload_recording(self, filename, props=None):
        if not props:
            props = {"type": "thermalRaw"}
        return self._upload("/api/v1/recordings", filename, props)

    def upload_audio_recording(self, filename, props=None):
        if not props:
            props = {}
        return self._upload("/api/v1/audiorecordings", filename, props)

    def record_event(self, type_, details, times=None):
        data = {"description": {"type": type_, "details": details}}
        return self.record_event_data(data, times)

    def record_event_from_id(self, eventDetailId, times=None):
        return self.record_event_data({"eventDetailId": eventDetailId}, times)

    def record_event_data(self, eventData, times=None):
        if times is None:
            times = [datetime.now()]
        eventData["dateTimes"] = [t.isoformat() for t in times]
        url = urljoin(self._baseurl, "/api/v1/events")

        response = requests.post(url, headers=self._auth_header, json=eventData)
        self._check_response(response)
        return response.json()["eventsAdded"], response.json()["eventDetailId"]

    def get_audio_schedule(self):
        url = urljoin(self._baseurl, "/api/v1/schedules")
        response = requests.get(url, headers=self._auth_header)
        self._check_response(response)
        return response.json()
