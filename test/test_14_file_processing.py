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
        file_processing.put(
            recording,
            success=True,
            complete=False,
            updates={"additionalMetadata": {"one": "foo"}},
        )
        check_recording(
            user,
            recording["id"],
            processingState="toMp4",
            additionalMetadata={"one": "foo"},
        )

        # Now finalise processing.
        file_processing.put(
            recording,
            success=True,
            complete=True,
            updates={
                "additionalMetadata": {"two": "bar"},
                "fileMimeType": "application/cheese",
            },
            new_object_key=recording["rawFileKey"],
        )
        check_recording(
            user,
            recording["id"],
            processingState="FINISHED",
            fileMimeType="application/cheese",
            additionalMetadata={"one": "foo", "two": "bar"},  # note: merged
        )


def check_recording(user, recording_id, **expected):
    r = user.get_recording(recording_id)
    for name, value in expected.items():
        if name == "additionalMetadata":
            # Just check the specific keys to allow for other
            # additionalMetadata keys on the recording which are
            # outside the scope of the test.
            for k, v in value.items():
                assert r[name][k] == v
        else:
            assert r[name] == value
