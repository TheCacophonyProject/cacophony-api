import pytest
import json


class TestRecordings:
    def test_unprocessed_recording_doesnt_return_processed_jwt(self, helper):
        print("If a new user uploads a recording")
        bob = helper.given_new_user(self, "bob_limit")
        bobsGroup = helper.make_unique_group_name(self, "bobs_group")
        bob.create_group(bobsGroup)
        bobsDevice = helper.given_new_device(self, "bobs_device", bobsGroup)
        recording = bobsDevice.upload_recording()

        print("And then fetches it before it has been processed")
        response = bob.get_recording_response(recording)

        print("  The response should have a JWT for the raw file")
        assert "downloadRawJWT" in response
        print("  But the response should not have a JWT for the processed file")
        assert "downloadFileJWT" not in response

    def test_recording_doesnt_include_file_key(self, helper):
        print("If a new user uploads a recording")
        bob = helper.given_new_user(self, "bob_limit")
        bobsGroup = helper.make_unique_group_name(self, "bobs_group")
        bob.create_group(bobsGroup)
        bobsDevice = helper.given_new_device(self, "bobs_device", bobsGroup)
        recording = bobsDevice.upload_recording()

        print("And then fetches it")
        recording_response = bob.get_recording(recording)

        print("  The recording response should not contain the fileKeys")
        assert "rawFileKey" not in recording_response
        assert "fileKey" not in recording_response
