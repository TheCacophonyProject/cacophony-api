from datetime import datetime, timedelta
import json

from testrecording import TestRecording


class TestDevice:
    def __init__(self, devicename, deviceapi):
        self._deviceapi = deviceapi
        self.devicename = devicename
        self._recordingtimeoffset = 24

    def has_recording(self):
        self._print_description("    and '{}' has a recording ".format(
            self.devicename))
        return self.upload_recording()

    def has_audio_recording(self):
        self._print_description("    and '{}' has an audio recording ".format(
            self.devicename))
        return self.upload_audio_recording()

    def upload_recording(self):
        props = json.dumps({
            "type": "thermalRaw",
            "recordingDateTime": self._make_timestamp(),
            "duration": 10,
        })
        recording_id = self._deviceapi.upload_recording(
            'files/small.cptv', props)
        return TestRecording(recording_id)

    def upload_audio_recording(self):
        props = json.dumps({
            "recordingDateTime": self._make_timestamp(),
            "duration": 1,
        })
        recording_id = self._deviceapi.upload_audio_recording(
            'files/small.mp3', props)
        return TestRecording(recording_id)

    def _make_timestamp(self):
        # recordings need to be recorded at different second times else the search code doesn't work
        timestamp = datetime.utcnow() - timedelta(
            seconds=self._recordingtimeoffset)
        self._recordingtimeoffset -= 1
        return timestamp.isoformat()

    def _print_description(self, description):
        print(description, end='')
