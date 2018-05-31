from datetime import datetime, timedelta, timezone

from .testrecording import TestRecording


class TestDevice:
    def __init__(self, devicename, deviceapi, helper):
        self._deviceapi = deviceapi
        self.devicename = devicename
        self._helper = helper
        self._recordingtimeoffset = 24
        self._id = None

    def has_recording(self):
        self._print_description("    and '{}' has a recording ".format(
            self.devicename))
        return self.upload_recording()

    def has_audio_recording(self):
        self._print_description("    and '{}' has an audio recording ".format(
            self.devicename))
        return self.upload_audio_recording()

    def upload_recording(self):
        props = {
            "type": "thermalRaw",
            "recordingDateTime": self._make_timestamp().isoformat(),
            "duration": 10,
            "comment": "hmmm",
            "batteryLevel": 98,
            "batteryCharging": "CHARGING",
            "airplaneModeOn": False,
            "version": "223",
            "additionalMetadata": {
                "bar": "foo",
            },
        }
        filename = 'files/small.cptv'
        recording_id = self._deviceapi.upload_recording(filename, props)
        return TestRecording(recording_id, props, slurp(filename))

    def upload_audio_recording(self):
        ts = self._make_timestamp()
        props = {
            "recordingDateTime": ts.isoformat(),
            "recordingTime": ts.strftime("%H:%M:%S"),
            "duration": 2,
            "batteryLevel": 99,
            "batteryCharging": "FULL",
            "airplaneModeOn": False,
            "relativeToDawn": 9877,
            "relativeToDusk": -6543,
            "version": "123",
            "additionalMetadata": {
                "foo": "bar",
            },
        }
        filename = 'files/small.mp3'
        recording_id = self._deviceapi.upload_audio_recording(filename, props)
        return TestRecording(recording_id, props, slurp(filename))

    def _make_timestamp(self):
        # recordings need to be recorded at different second times else the search code doesn't work
        timestamp = datetime.now(timezone.utc) - timedelta(
            seconds=self._recordingtimeoffset)
        self._recordingtimeoffset -= 1
        return timestamp

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
        eventsAdded, detailsId = self._deviceapi.record_event_from_id(detailId, times)

        print('Then three events should have been recorded.')
        assert eventsAdded == 3
        return detailsId

    def get_id(self):
        if (self._id is None):
            self._id= self._helper.admin_user().get_device_id(self.devicename)
        return self._id

    def download_audio_bait(self, file_id):
        return self._deviceapi.download_file(file_id)

    def get_audio_schedule(self):
        return self._deviceapi.get_audio_schedule()

def slurp(filename):
    with open(filename, 'rb') as f:
        return f.read()
