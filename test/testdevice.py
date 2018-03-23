import datetime
import json


class TestDevice:
    def __init__(self, devicename, deviceapi):
        self._deviceapi = deviceapi
        self.devicename = devicename

    def upload_recording(self):
        recordingtime = datetime.datetime.utcnow().isoformat()
        props = json.dumps({
            "type": "thermalRaw",
            "recordingDateTime": recordingtime,
            "duration": 10,
        })
        return self._deviceapi.upload_recording('files/small.cptv', props)

    def upload_audio_recording(self):
        recordingtime = datetime.datetime.utcnow().isoformat()
        props = json.dumps({
            "recordingDateTime": recordingtime,
            "duration": 1,
        })
        return self._deviceapi.upload_audio_recording('files/small.mp3', props)
