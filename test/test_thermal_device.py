class TestThermalDevice:
    def test_can_upload_cptv(self, helper):
        description = "If a new device 'Destroyer' signs up"
        destroyer = helper.given_new_device(self, "Destroyer", description=description)

        print("Then 'Destroyer' should able to log in")
        helper.login_as_device(destroyer.devicename, helper.config.default_group)

        print("And 'Destroyer' should be able to upload a CPTV file")
        destroyer.upload_recording()

        print("And the CPTV file should be visible to super users")
        helper.admin_user().can_see_recording_from(destroyer)
