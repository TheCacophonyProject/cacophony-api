import json
from urllib.parse import urljoin

import requests


class FileProcessingAPI:
    def __init__(self, baseurl):
        self._url = urljoin(baseurl, "/api/fileProcessing")

    def get(self, recording_type, state):
        r = requests.get(self._url, params={"type": recording_type, "state": state})
        if r.status_code == 204:
            return None
        if r.status_code == 200:
            return r.json()["recording"]
        raise IOError(r.text)

    def put(self, recording, success, complete, updates=None, new_object_key=None):
        data = {
            "id": recording["id"],
            "jobKey": recording["jobKey"],
            "success": success,
            "complete": complete,
        }
        if updates:
            data["result"] = json.dumps({"fieldUpdates": updates})
        if new_object_key:
            data["newProcessedFileKey"] = new_object_key

        r = requests.put(self._url, data=data)
        if r.status_code == 200:
            return
        raise IOError(r.text)
