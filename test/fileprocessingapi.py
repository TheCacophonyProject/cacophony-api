import json
from urllib.parse import urljoin

import requests

from .testrecording import TestRecording


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
            return TestRecording(id_, data, None)

        raise IOError(r.text)

    def put(self, recording, success, complete, updates=None, new_object_key=None):
        post_data = {
            "id": recording.recordingId,
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
        raise IOError(r.text)

    def add_track(self, recording, track):
        url = self._url + "/{}/tracks".format(recording.recordingId)
        post_data = {"data": json.dumps(track.data), "algorithm": track.algorithm}
        r = requests.post(url, data=post_data)
        if r.status_code == 200:
            return r.json()["trackId"]
        raise IOError(r.text)

    def clear_tracks(self, recording):
        r = requests.delete(self._url + "/{}/tracks".format(recording.recordingId))
        r.raise_for_status()

    def add_track_tag(self, track, tag):
        url = self._url + "/{}/tracks/{}/tags".format(
            track.recording.recordingId, track.track_id
        )
        post_data = {
            "what": tag.what,
            "confidence": tag.confidence,
            "data": json.dumps(tag.data),
        }
        r = requests.post(url, data=post_data)
        if r.status_code == 200:
            return r.json()["trackTagId"]
        raise IOError(r.text)
