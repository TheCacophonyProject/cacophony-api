from datetime import datetime
from .helper import Helper
from test.testexception import AuthorizationError


class TestDeviceCacophonyIndex:
    @classmethod
    def setup_class(cls):
        helper = Helper()
        print("If a user Johnny wants to access the cacophony index for a device")
        user, device = helper.given_new_user_with_device(cls, "little_johnny")
        cls._device = device
        cls._user = user
        # upload a series of recordings for the device, attributed to different times of day
        # and to different days over the past n days.
        # Make the cacophony index start low, and get progressively higher.
        now = datetime.now().timestamp()
        seconds_in_hour = 60 * 60
        num_days = 1
        for day in range(1, num_days + 1):
            for hour in range(0, 24):
                ts = datetime.fromtimestamp(now - (hour * seconds_in_hour * day))
                recording = device.upload_audio_recording(
                    {
                        "recordingDateTime": ts.isoformat(),
                        "recordingTime": ts.strftime("%H:%M:%S"),
                        "duration": 60,
                        "additionalMetadata": {
                            "foo": "bar",
                            "analysis": {
                                "cacophony_index": [
                                    {"end_s": 20, "begin_s": 0, "index_percent": 33.4 + (0.02 * hour * day)},
                                    {"end_s": 41, "begin_s": 21, "index_percent": 34.7 + (0.02 * hour * day)},
                                    {"end_s": 60, "begin_s": 42, "index_percent": 32.1 + (0.02 * hour * day)},
                                ]
                            },
                        },
                    }
                )
                js_timestamp = js_iso_format_with_utc(
                    datetime.utcfromtimestamp(now - (hour * seconds_in_hour * day))
                )
                print(f"added a recording at {js_timestamp} '{recording.id_}' with cacophony index data")

    def get_device(self):
        return self._device

    def get_user(self):
        return self._user

    def test_get_cacophony_index(self, helper):
        admin = helper.admin_user()
        johnny = self.get_user()
        print("If a user Johnny wants to access the cacophony index histogram for a device")
        cacophony_index = johnny.get_cacophony_index_for_device(self.get_device())
        assert cacophony_index["cacophonyIndex"] == 33.63
        cacophony_index_admin = admin.get_cacophony_index_for_device(self.get_device())
        assert cacophony_index_admin["cacophonyIndex"] == 33.63

        # We only have 1 day of index values in the DB, so get only a window of 12 hours
        cacophony_index_twelve_hours = johnny.get_cacophony_index_for_device(
            self.get_device(), js_iso_format_with_utc(datetime.utcnow()), 12
        )
        assert cacophony_index_twelve_hours["cacophonyIndex"] == 33.51

        cacophony_index_zero_window = johnny.get_cacophony_index_for_device(
            self.get_device(), js_iso_format_with_utc(datetime.utcnow()), 0
        )
        assert cacophony_index_zero_window["cacophonyIndex"] is None

        cacophony_index_from_twelve_hours_ago = johnny.get_cacophony_index_for_device(
            self.get_device(),
            js_iso_format_with_utc(datetime.utcfromtimestamp(datetime.now().timestamp() - (60 * 60 * 12))),
            12,
        )
        assert cacophony_index_from_twelve_hours_ago["cacophonyIndex"] == 33.63

        # Make sure only the correct users can see the device cacophony-index.
        random_user = helper.given_new_user(self, "dis_random_guy")
        try:
            random_user.get_cacophony_index_for_device(self.get_device())
        except AuthorizationError:
            pass

    def test_get_cacophony_index_histogram(self, helper):
        admin = helper.admin_user()
        johnny = self.get_user()
        cacophony_index = johnny.get_cacophony_index_histogram_for_device(self.get_device())
        assert len(cacophony_index["cacophonyIndex"]) == 24
        cacophony_index_admin = admin.get_cacophony_index_histogram_for_device(self.get_device())
        assert len(cacophony_index_admin["cacophonyIndex"]) == 24

        cacophony_index_from_twelve_hours_ago = johnny.get_cacophony_index_histogram_for_device(
            self.get_device(),
            js_iso_format_with_utc(datetime.fromtimestamp(datetime.now().timestamp() - (60 * 60 * 12))),
            12,
        )
        assert len(cacophony_index_from_twelve_hours_ago["cacophonyIndex"]) == 12

        # Make sure only the correct users can see the device cacophony-index.
        random_user = helper.given_new_user(self, "dis_random_guy")
        try:
            random_user.get_cacophony_index_histogram_for_device(self.get_device())
        except AuthorizationError:
            pass


def js_iso_format_with_utc(timestamp_utc):
    return timestamp_utc.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
