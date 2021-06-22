import pytest

from .testexception import AuthorizationError


class TestUserThermal:
    def test_can_download_recording(self, helper):
        device = helper.given_new_device(self, "user-thermal-download")
        recording = device.has_recording()

        print("\nA user should be able to download the recording")
        helper.admin_user().can_download_correct_recording(recording)

    def test_can_delete_recording(self, helper):
        device = helper.given_new_device(self, "user-thermal-delete")
        recording = device.has_recording()

        print("\nA user should be able to see the recording")
        user = helper.admin_user()
        user.can_see_recordings(recording)

        print("And when they delete it ... ", end="")
        user.delete_recording(recording)

        print("they can no longer see it.")
        user.cannot_see_recordings(recording)

    def test_can_update_recording(self, helper):
        device = helper.given_new_device(self, "user-thermal-update")
        recording = device.has_recording()

        new_comment = "very interesting"

        print("\nWhen a user updates a recording")
        user = helper.admin_user()
        user.update_recording(recording, comment=new_comment)

        print("the change is reflected on the API server.")
        recording["comment"] = new_comment
        user.can_download_correct_recording(recording)

    def test_can_upload_recording_for_device(self, helper):
        data_collector, device = helper.given_new_user_with_device(self, "data_collector")
        print("   and data_collector uploads a recording on behalf of the device")
        recording = data_collector.uploads_recording_for(device)
        print("Then an super user should be able to download the recording")
        helper.admin_user().can_download_correct_recording(recording)

    def test_must_have_permission_to_upload_recording_for_device(self, helper):
        device = helper.given_new_device(self, "random_device")

        print("    and an unrelated user 'trouble'", end="")
        trouble = helper.given_new_user(self, "trouble")

        print("Then 'trouble' should not be able to upload a recording on the behalf of the device.")
        with pytest.raises(AuthorizationError):
            trouble.uploads_recording_for(device)

    def test_cant_download_recording_via_audio_api(self, helper):
        device = helper.given_new_device(self, "user-thermal-download")
        recording = device.has_recording()

        user = helper.given_new_user(self, "trouble")

        print("\nA user should not be able to download the recording using the audio API")
        user.cannot_download_recording(recording)

    def test_can_upload_recording_for_device_legacy(self, helper):
        data_collector, device = helper.given_new_user_with_device(self, "data_collector")
        print("   and data_collector uploads a recording on behalf of the device")
        recording = data_collector.legacy_uploads_recording_for(device)
        print("Then an super user should be able to download the recording")
        helper.admin_user().can_download_correct_recording(recording)

    def test_must_have_permission_to_upload_recording_for_device_legacy(self, helper):
        device = helper.given_new_device(self, "random_device")

        print("    and an unrelated user 'trouble'", end="")
        trouble = helper.given_new_user(self, "trouble")

        print("Then 'trouble' should not be able to upload a recording on the behalf of the device.")
        with pytest.raises(AuthorizationError):
            trouble.legacy_uploads_recording_for(device)

    @pytest.mark.skip(reason="Enable when group+device uniqueness implemented")
    def test_upload_recording_for_legacy_duplicate(self, helper):
        user = helper.given_new_user(self, "someone")

        # Create two devices with the same name in different groups
        device_name = helper.random_id(length=30)

        group_name0 = helper.make_unique_group_name(self, "someone0")
        group0 = user.create_group(group_name0)
        helper.given_new_device(None, devicename=device_name, group=group0)

        group_name1 = helper.make_unique_group_name(self, "someone1")
        group1 = user.create_group(group_name1)
        device1 = helper.given_new_device(None, devicename=device_name, group=group1)
        user.legacy_uploads_recording_for(device1)
