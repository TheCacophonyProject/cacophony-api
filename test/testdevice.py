from datetime import datetime, timedelta, timezone
from .deviceapi import DeviceAPI
from .recording import Recording


class TestDevice:
    def __init__(self, devicename, deviceapi: DeviceAPI, helper, group=None, location=None):
        self._deviceapi = deviceapi
        self.devicename = devicename
        self._helper = helper
        self._id = deviceapi.id
        self.group = group
        self.location = location

    def get_id(self):
        return self._id

    def has_recording(self, props=None):
        self._print_description("    and '{}' has a recording with props {}".format(self.devicename, props))
        return self.upload_recording(properties=props)

    def has_audio_recording(self):
        self._print_description("    and '{}' has an audio recording ".format(self.devicename))
        return self.upload_audio_recording()

    def upload_recording(self, properties=None):
        props = self.get_new_recording_props()
        if properties:
            props.update(properties)
        filename = "files/small.cptv"
        recording_id = self._deviceapi.upload_recording(filename, props)

        # Expect to see this in data returned by the API server.
        props["rawMimeType"] = "application/x-cptv"

        return Recording(recording_id, props, filename)

    def get_new_recording_props(self):
        props = {
            "type": "thermalRaw",
            "recordingDateTime": _new_timestamp().isoformat(),
            "duration": 10,
            "comment": "hmmm",
            "batteryLevel": 98,
            "batteryCharging": "CHARGING",
            "airplaneModeOn": False,
            "version": "223",
            "additionalMetadata": {"bar": "foo"},
        }
        if self.location:
            props["location"] = self.location

        return props

    def upload_audio_recording(self, extraProps={}):
        ts = _new_timestamp()
        props = {
            "type": "audio",
            "recordingDateTime": ts.isoformat(),
            "recordingTime": ts.strftime("%H:%M:%S"),
            "duration": 2,
            "batteryLevel": 98,
            "batteryCharging": "FULL",
            "airplaneModeOn": False,
            "comment": "a comment",
            "version": "323",
            "additionalMetadata": {
                "foo": "bar",
                "analysis": {
                    "cacophony_index": [
                        {"end_s": 20, "begin_s": 0, "index_percent": 83.3},
                        {"end_s": 41, "begin_s": 21, "index_percent": 93.3},
                    ]
                },
            },
        }
        if self.location:
            props["location"] = self.location
        if extraProps:
            props.update(extraProps)
        filename = "files/small.mp3"
        recording_id = self._deviceapi.upload_recording(filename, props)
        props["rawMimeType"] = "audio/mpeg"
        return Recording(recording_id, props, filename)

    def _print_description(self, description):
        print(description, end="")

    def record_event(self, type_, details, times=None):
        count, detailsId = self._deviceapi.record_event(type_, details, times)
        assert count == 1
        return detailsId

    def record_three_events_at_once(self, detailId):
        print("    which has three events uploaded with detail id {}.".format(detailId))
        now = datetime.now()
        times = [now, now - timedelta(seconds=2), now - timedelta(seconds=4)]
        eventsAdded, detailsId = self._deviceapi.record_event_from_id(detailId, times)

        print("Then three events should have been recorded.")
        assert eventsAdded == 3
        return detailsId

    def download_audio_bait(self, file_id):
        file_json = self._deviceapi.get_file(file_id)
        file = self._deviceapi._download_signed(file_json["jwt"])
        file_bytes = 0
        for chunk in file:
            file_bytes += len(chunk)
        assert file_bytes == file_json["fileSize"]
        return file

    def get_audio_schedule(self):
        return self._deviceapi.get_audio_schedule()

    def reregister(self, new_name, new_group, new_password):
        self._deviceapi.reregister(new_name, new_group, new_password)


def _new_timestamp():
    return datetime.now(timezone.utc)
