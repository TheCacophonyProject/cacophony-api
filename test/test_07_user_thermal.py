import pytest

class TestUserThermal:
    def test_can_download_recording(self, helper):
        device = helper.given_new_device(self, 'user-thermal-download')
        recording = device.has_recording()

        print("\nA user should be able to download the recording")
        helper.admin_user().can_download_correct_recording(recording)

    def test_can_delete_recording(self, helper):
        device = helper.given_new_device(self, 'user-thermal-delete')
        recording = device.has_recording()

        print("\nA user should be able to see the recording")
        user = helper.admin_user()
        user.can_see_recordings(recording)

        print("And when they delete it ... ", end='')
        user.delete_recording(recording)

        print("they can no longer see it.")
        user.cannot_see_recordings(recording)

    def test_can_update_recording(self, helper):
        device = helper.given_new_device(self, 'user-thermal-update')
        recording = device.has_recording()

        new_comment = 'very interesting'

        print("\nWhen a user updates a recording")
        user = helper.admin_user()
        user.update_recording(recording, comment=new_comment)

        print("the change is reflected on the API server.")
        recording['comment'] = new_comment
        user.can_download_correct_recording(recording)

    def test_can_upload_recording_for_device(self, helper):
        data_collector, device = helper.given_new_user_with_device(self, "data_collector")
        recording = data_collector.uploads_recording_for(device)

        print("\nA user should be able to download the recording")
        helper.admin_user().can_download_correct_recording(recording)

    def test_must_have_permission_to_upload_recording_for_device(self, helper):
        device = helper.given_new_device(self, 'random_device')

        print("If a new user 'trouble' signs up", end='')
        trouble = helper.given_new_user(self, 'trouble')

        print("Then 'trouble' should not be able to get audio schedule for the hollerer.")
        with pytest.raises(OSError, message="On no 'trouble' could upload a video pretending to be this device"):
            recording = trouble.uploads_recording_for(device)

