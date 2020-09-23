from datetime import datetime, timedelta
from dateutil import tz
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
        # Make the cacophony index start high, and get progressively lower.

        # NOTE: This needs to be a timestamp in 'Auckland/Pacific' timezone, since that's what
        #  the database is going to interpret it as.  This should either be documented or fixed.
        local_tz = tz.gettz("Pacific/Auckland")
        offset = local_tz.utcoffset(datetime.now())
        now = datetime.utcnow()
        cls._now = now
        now = now + offset
        num_days = 1

        for day in range(0, num_days):
            for hour in range(0, 24):
                ts = now - timedelta(hours=hour, days=day)
                recording = device.upload_audio_recording(
                    {
                        "recordingDateTime": ts.isoformat(),
                        "recordingTime": ts.strftime("%H:%M:%S"),
                        "duration": 60,
                        "additionalMetadata": {
                            "foo": "bar",
                            "analysis": {
                                "cacophony_index": [
                                    {"end_s": 20, "begin_s": 0, "index_percent": hour + (day * 24)}
                                ]
                            },
                        },
                    }
                )
                js_timestamp = js_iso_format_with_utc(now - timedelta(hours=hour, days=day))
                print(
                    f"added a recording at {js_timestamp} '{recording.id_}' with cacophony index data {hour + (day * 24)}"
                )

    def now(self):
        return self._now

    def get_device(self):
        return self._device

    def get_user(self):
        return self._user

    def test_get_cacophony_index(self, helper):
        admin = helper.admin_user()
        johnny = self.get_user()
        print("If a user Johnny wants to access the cacophony index histogram for a device")
        cacophony_index = johnny.get_cacophony_index_for_device(self.get_device())
        assert cacophony_index["cacophonyIndex"] == 11.5
        cacophony_index_admin = admin.get_cacophony_index_for_device(self.get_device())
        assert cacophony_index_admin["cacophonyIndex"] == 11.5

        now = self.now()
        # We only have 1 day of index values in the DB, so get only a window of 12 hours
        print(f"Get cacophony index from now ({js_iso_format_with_utc(now)}, {now}), going back 12 hours")
        cacophony_index_twelve_hours = johnny.get_cacophony_index_for_device(
            self.get_device(), js_iso_format_with_utc(now), 12
        )
        assert cacophony_index_twelve_hours["cacophonyIndex"] == 5.5

        print(f"Get cacophony index from now ({js_iso_format_with_utc(now)}), going back 0 hours")
        cacophony_index_zero_window = johnny.get_cacophony_index_for_device(
            self.get_device(), js_iso_format_with_utc(now), 0
        )
        assert cacophony_index_zero_window["cacophonyIndex"] is None

        now_minus_twelve_hours = js_iso_format_with_utc(now - timedelta(hours=12))
        print(f"Get cacophony index from 12 hours ago ({now_minus_twelve_hours}), going back 12 hours")
        cacophony_index_from_twelve_hours_ago = johnny.get_cacophony_index_for_device(
            self.get_device(), now_minus_twelve_hours, 12
        )
        assert cacophony_index_from_twelve_hours_ago["cacophonyIndex"] == 17.5

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

        now = self.now()
        cacophony_index_from_twelve_hours_ago = johnny.get_cacophony_index_histogram_for_device(
            self.get_device(), js_iso_format_with_utc(now - timedelta(hours=12)), 12
        )
        assert len(cacophony_index_from_twelve_hours_ago["cacophonyIndex"]) == 12

        # Make sure only the correct users can see the device cacophony-index.
        random_user = helper.given_new_user(self, "dis_random_guy")
        try:
            random_user.get_cacophony_index_histogram_for_device(self.get_device())
        except AuthorizationError:
            pass


def py_iso_format(timestamp_utc):
    return timestamp_utc.strftime("%Y-%m-%d %H:%M:%S.%f")


def js_iso_format_with_utc(timestamp_utc):
    return timestamp_utc.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
