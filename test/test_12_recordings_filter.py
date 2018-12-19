import pytest
import json


class TestRecordingsFilter:
    def test_latitude_longitude_filter(self, helper):
        print("If a new user Bob has a device upload a recording")
        bob = helper.given_new_user(self, "bob")
        bobsGroup = helper.make_unique_group_name(self, "bobs_group")
        bob.create_group(bobsGroup)
        bobsDevice = helper.given_new_device(self, "bobs_device", bobsGroup)
        rec = bobsDevice.upload_recording({"location": [20, 20]})

        print("  The recording shoudl have a defautl precision of 100m")
        rec_prec_default = bob.get_recording(rec.recordingId)
        assert rec_prec_default["location"]["coordinates"] == [20.00025, 20.00025]

        print("  Bob should not be able to get a precision higher than 100m")
        params_prec_10 = {"filterOptions": json.dumps({"latLongPrec": 10})}
        rec_prec_attempt_10 = bob.get_recording(rec.recordingId, params_prec_10)
        assert rec_prec_attempt_10["location"]["coordinates"] == [20.00025, 20.00025]

        print("  Bob should be able to use a precision lower than 100m")
        params_prec_200 = {"filterOptions": json.dumps({"latLongPrec": 200})}
        rec_prec_attempt_200 = bob.get_recording(rec.recordingId, params_prec_200)
        assert rec_prec_attempt_200["location"]["coordinates"] == [
            20.000700000000002,
            20.000700000000002,
        ]

        print("  An admin should be able to use a precision higher than 100m")
        params_prec_200 = {"filterOptions": json.dumps({"latLongPrec": 10})}
        rec_prec_attempt_200 = helper.admin_user().get_recording(
            rec.recordingId, params_prec_200
        )
        assert rec_prec_attempt_200["location"]["coordinates"] == [20.000025, 20.000025]

        print("  Recordings from a normal query shoudl also be filtered", end="")
        rec = bob.query_recordings(filterOptions=json.dumps({"latLongPrec": 10}))[0]
        assert rec["location"]["coordinates"] == [20.00025, 20.00025]
