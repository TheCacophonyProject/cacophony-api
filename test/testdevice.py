from datetime import datetime, timedelta
import json

from .testrecording import TestRecording


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
        filename = 'files/small.cptv'
        recording_id = self._deviceapi.upload_recording(filename, props)
        return TestRecording(recording_id, slurp(filename))

    def upload_audio_recording(self):
        props = json.dumps({
            "recordingDateTime": self._make_timestamp(),
            "duration": 1,
        })
        filename = 'files/small.mp3'
        recording_id = self._deviceapi.upload_audio_recording(filename, props)
        return TestRecording(recording_id, slurp(filename))

    def _make_timestamp(self):
        # recordings need to be recorded at different second times else the search code doesn't work
        timestamp = datetime.utcnow() - timedelta(
            seconds=self._recordingtimeoffset)
        self._recordingtimeoffset -= 1
        return timestamp.isoformat()

    def _print_description(self, description):
        print(description, end='')

    def record_event(self, _type, details, extraText = "    which"):
        self._print_description("{} has an event of type '{}' with details '{}'.".format(extraText, _type, details))
        (count, detailsId) = self._deviceapi.record_event(_type, details)
        print("  (EventDetails Id = {})".format(detailsId))
        assert count == 1
        return detailsId

    def record_three_events_at_once(self, detailId):
        print("    which has three events uploaded with detail id {}.".format(detailId))
        times = [
            datetime.utcnow().isoformat(),
            (datetime.utcnow() - timedelta(seconds=2)).isoformat(),
            (datetime.utcnow() - timedelta(seconds=4)).isoformat(),
        ]
        (eventsAdded, detailsId) = self._deviceapi.record_event_from_id(detailId, times)

        print('Then three events should have been recorded.')
        assert eventsAdded == 3
        return detailsId


def slurp(filename):
    with open(filename, 'rb') as f:
        return f.read()
