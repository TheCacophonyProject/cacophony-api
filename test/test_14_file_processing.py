class TestFileProcessing:
    def test_thermal_video(self, helper, file_processing):
        user = helper.admin_user()

        # Ensure there's a recording to work with (the file processing
        # API may return a different one though).
        helper.given_a_recording(self)

        # Get a recording to process.
        recording = file_processing.get("thermalRaw", "getMetadata")
        assert recording["processingState"] == "getMetadata"

        # Move job to next stage.
        file_processing.put(recording, success=True, complete=False)
        check_recording(user, recording["id"], processingState="toMp4")

        # Now finalise processing.
        file_processing.put(
            recording, success=True, complete=True, new_object_key="some_key"
        )
        check_recording(
            user, recording["id"], processingState="FINISHED", fileKey="some_key"
        )

    def test_metadata_update(self, helper, file_processing):
        user = helper.admin_user()
        helper.given_a_recording(self)

        # Get a recording to process.
        recording = file_processing.get("thermalRaw", "getMetadata")

        # Change the fileMimeType field.
        file_processing.put(
            recording,
            success=True,
            complete=False,
            updates={"fileMimeType": "application/cheese"},
        )
        check_recording(user, recording["id"], fileMimeType="application/cheese")

    def test_addtionalMetadata_update(self, helper, file_processing):
        user = helper.admin_user()
        helper.given_a_recording(self)

        # Get a recording to process.
        recording = file_processing.get("thermalRaw", "getMetadata")

        # Update additionalMetadata.
        file_processing.put(
            recording,
            success=True,
            complete=False,
            updates={"additionalMetadata": {"one": "1", "two": "2"}},
        )
        check_recording(
            user, recording["id"], additionalMetadata={"one": "1", "two": "2"}
        )

        # Now override one of the previous additionalMetadata keys and add another.
        file_processing.put(
            recording,
            success=True,
            complete=True,
            updates={"additionalMetadata": {"two": "foo", "three": "3"}},
        )

        # additionalMetadata updates should be merged.
        check_recording(
            user,
            recording["id"],
            additionalMetadata={"one": "1", "two": "foo", "three": "3"},
        )


def check_recording(user, recording_id, **expected):
    r = user.get_recording(recording_id)
    print(r)
    for name, value in expected.items():
        if name == "additionalMetadata":
            # Just check the specific keys to allow for other
            # additionalMetadata keys on the recording which are
            # outside the scope of the test.
            for k, v in value.items():
                assert r[name][k] == v
        else:
            assert r[name] == value
