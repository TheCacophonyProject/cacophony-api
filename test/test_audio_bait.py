import pytest

from test.testexception import AuthorizationError


class TestBait:
    def test_anyone_or_device_can_download_audio_bait(self, helper):
        print("If a user Grant uploads an audio file")
        audio_bait = helper.given_new_user(self, "grant").upload_audio_bait()

        print("Then his friend Howard should be able to download it")
        helper.given_new_user(self, "howard").download_audio_bait(audio_bait)

        print("And a device should be able to download the file")
        helper.given_new_device(
            self, "possum-gone-ator", description=""
        ).download_audio_bait(audio_bait)

    def test_check_get_all_audio_baits(self, helper):
        print("If an audio bait file is uploaded")
        special_id = helper.random_id()
        bait_props = {"animal": "possum", "special_id": special_id}

        uploaded_bait = helper.admin_user().upload_audio_bait(bait_props)

        print(
            "Then any user, eg Ivan, should be able to get it in the list of audio files"
        )
        ivan = helper.given_new_user(self, "ivan")
        downloaded_info = ivan.get_all_audio_baits().get_info_for(uploaded_bait)
        assert downloaded_info

        print("And audio bait info should have a defined user id")
        assert downloaded_info["UserId"]
        print("    and EventDetail.type = 'audio-bait-played'")
        assert downloaded_info["type"] == "audioBait"
        print(
            "    and details should have 'animal' as 'possum' and 'special_id' as '{}'".format(
                special_id
            )
        )
        print(downloaded_info["details"])
        assert downloaded_info["details"]["animal"] == "possum"
        assert downloaded_info["details"]["special_id"] == special_id
        print("    and does not list the file key")
        assert not downloaded_info.get("fileKey")

    def test_delete_audio_bait(self, helper):
        print("Given james has uploaded some audio bait files")
        james = helper.given_new_user(self, "James")

        file1 = james.upload_audio_bait()
        file2 = james.upload_audio_bait()

        print("Then he should be able to delete a file")
        james.delete_audio_bait_file(file1)

        print("But his friend Karl should not.")
        with pytest.raises(AuthorizationError):
            helper.given_new_user(self, "karl").delete_audio_bait_file(file2)

        print("And the admin should also be able to delete a file")
        helper.admin_user().delete_audio_bait_file(file2)
