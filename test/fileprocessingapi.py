import json
from urllib.parse import urljoin

import requests

from .testexception import raise_specific_exception
from .recording import Recording


class FileProcessingAPI:
    def __init__(self, baseurl):
        self._url = urljoin(baseurl, "/api/fileProcessing")

    def get(self, recording_type, state):
        r = requests.get(self._url, params={"type": recording_type, "state": state})
        if r.status_code == 204:
            return None
        if r.status_code == 200:
            data = r.json()["recording"]
            id_ = data.pop("id")
            return Recording(id_, data, None)
        raise_specific_exception(r)

    def put(self, recording, success, complete, updates=None, new_object_key=None):
        post_data = {
            "id": recording.id_,
            "jobKey": recording["jobKey"],
            "success": success,
            "complete": complete,
        }
        if updates:
            post_data["result"] = json.dumps({"fieldUpdates": updates})
        if new_object_key:
            post_data["newProcessedFileKey"] = new_object_key

        r = requests.put(self._url, data=post_data)
        if r.status_code == 200:
            return
        raise_specific_exception(r)

    def get_algorithm_id(self, algorithm):
        url = self._url + "/algorithm"
        post_data = {"algorithm": json.dumps(algorithm)}
        r = requests.post(url, data=post_data)
        if r.status_code == 200:
            return r.json()["algorithmId"]
        raise_specific_exception(r)

    def add_track(self, recording, track, algorithm={"tracking-format": 42}):
        algorithm_id = self.get_algorithm_id(algorithm)
        url = self._url + "/{}/tracks".format(recording.id_)
        post_data = {"data": json.dumps(track.data), "algorithmId": algorithm_id}
        r = requests.post(url, data=post_data)
        if r.status_code == 200:
            return r.json()["trackId"]
        raise_specific_exception(r)

    def clear_tracks(self, recording):
        r = requests.delete(self._url + "/{}/tracks".format(recording.id_))
        raise_specific_exception(r)

    def add_track_tag(self, track, tag):
        url = self._url + "/{}/tracks/{}/tags".format(track.recording.id_, track.id_)
        post_data = {
            "what": tag.what,
            "confidence": tag.confidence,
            "data": json.dumps(tag.data),
        }
        r = requests.post(url, data=post_data)
        if r.status_code == 200:
            return r.json()["trackTagId"]
        raise_specific_exception(r)
