import pytest


class TestSmoke:
    test_server = "https://api-test.cacophony.org.nz"
    groupName = "group107"

    def test_can_upload_audio(self, helper):
        helper.config.api_url = self.test_server

        listener = helper.given_new_device(self, "Listener_" + self.groupName, group=self.groupName)

        print("Then 'Listener' should able to log in")
        helper.login_as_device(listener.devicename, self.groupName)

        print("And 'Listener' should be able to upload an audio file")
        recording = listener.upload_audio_recording()

    def test_can_upload_cptv(self, helper):
        helper.config.api_url = self.test_server

        watcher = helper.given_new_device(self, "Watcher_" + self.groupName, group=self.groupName)

        print("Then 'Watcher' should able to log in")
        helper.login_as_device(watcher.devicename, self.groupName)

        print("And 'Watcher' should be able to upload an cptv file")
        recording = watcher.upload_recording()
