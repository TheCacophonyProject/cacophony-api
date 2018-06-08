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
