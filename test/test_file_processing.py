from datetime import datetime, timezone

from .recording import Recording
from .track import Track
from .track import TrackTag


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
        check_recording(user, recording, processingState="toMp4")

        # Now finalise processing.
        file_processing.put(
            recording, success=True, complete=True, new_object_key="some_key"
        )
        check_recording(user, recording, processingState="FINISHED", fileKey="some_key")

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
        check_recording(user, recording, fileMimeType="application/cheese")

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
        check_recording(user, recording, additionalMetadata={"one": "1", "two": "2"})

        # Now override one of the previous additionalMetadata keys and add another.
        file_processing.put(
            recording,
            success=True,
            complete=True,
            updates={"additionalMetadata": {"two": "foo", "three": "3"}},
        )

        # additionalMetadata updates should be merged.
        check_recording(
            user, recording, additionalMetadata={"one": "1", "two": "foo", "three": "3"}
        )

    def test_can_upload_and_find_algorithm_keys(self, helper, file_processing):
        # Should be created
        algorithm1 = file_processing.get_algorithm_id({'timestamp': datetime.now(timezone.utc).isoformat()})
        algorithm2 = file_processing.get_algorithm_id({'speed': 'quick'})
        # Should be found in already in the database
        algorithm3 = file_processing.get_algorithm_id({'speed': 'quick'})

        assert algorithm1 != algorithm2
        assert algorithm2 == algorithm3

    def test_can_add_track_to_recording(self, helper, file_processing):
        user = helper.admin_user()
        helper.given_a_recording(self)

        recording = file_processing.get("thermalRaw", "getMetadata")

        track = Track.create(recording)
        track.id_ = file_processing.add_track(recording, track)

        user.can_see_track(track)

    def test_can_delete_all_tracks_for_a_recording(self, helper, file_processing):
        user = helper.admin_user()
        helper.given_a_recording(self)

        recording = file_processing.get("thermalRaw", "getMetadata")

        # Add some tracks to the recording.
        track0 = Track.create(recording)
        track0.id_ = file_processing.add_track(recording, track0)
        track1 = Track.create(recording)
        track1.id_ = file_processing.add_track(recording, track1)
        user.can_see_track(track0)
        user.can_see_track(track1)

        file_processing.clear_tracks(recording)

        user.cannot_see_track(track0)
        user.cannot_see_track(track1)

    def test_can_tag_track(self, helper, file_processing):
        user = helper.admin_user()
        helper.given_a_recording(self)

        recording = file_processing.get("thermalRaw", "getMetadata")

        track = Track.create(recording)
        track.id_ = file_processing.add_track(recording, track)

        tag = TrackTag.create(track, automatic=True)
        tag.id_ = file_processing.add_track_tag(track, tag)

        user.can_see_track(track, [tag])

    def test_reprocess_multiple_recordings(self, helper, file_processing):
        user = helper.admin_user()

        recordings = []
        recording_first = self.create_processed_recording(helper, file_processing, user)
        recordings.append(recording_first.id_)
        self.add_tracks_and_tag(file_processing, recording_first)

        recording_second = self.create_processed_recording(helper, file_processing, user)
        recordings.append(recording_second.id_)
        self.add_tracks_and_tag(file_processing, recording_second)

        status, json = user.reprocess_recordings(recordings)
        assert status == 200
        assert json["reprocessed"] == recordings

        user.has_no_tracks(recording_first)
        user.has_no_tracks(recording_second)

        recordings.append(-1)
        status, json = user.reprocess_recordings(recordings)
        assert status != 200
        assert json["reprocessed"] == [recording_first.id_, recording_second.id_]
        print(json)
        assert json["fail"] == [-1]

    def create_processed_recording(self, helper, file_processing, user):
        # Ensure there's a recording to work with (the file processing
        # API may return a different one though).
        helper.given_a_recording(self)

        # Get a recording to process.
        recording = file_processing.get("thermalRaw", "getMetadata")
        assert recording["processingState"] == "getMetadata"

        # Move job to next stage.
        file_processing.put(recording, success=True, complete=False)
        check_recording(user, recording, processingState="toMp4")

        # Now finalise processing.
        file_processing.put(
            recording, success=True, complete=True, new_object_key="some_key"
        )
        check_recording(user, recording, processingState="FINISHED", fileKey="some_key")
        return recording

    def add_tracks_and_tag(self, file_processing, recording):
        # insert tracks
        track = Track.create(recording)
        track.id_ = file_processing.add_track(recording, track)

        tag = TrackTag.create(track, automatic=True)
        tag.id_ = file_processing.add_track_tag(track, tag)
        return track, tag

    def test_reprocess_recording(self, helper, file_processing):
        user = helper.admin_user()
        recording = self.create_processed_recording(helper, file_processing, user)
        track, tag = self.add_tracks_and_tag(file_processing, recording)
        user.can_see_track(track, [tag])

        user.reprocess(recording)
        recording = file_processing.get("thermalRaw", "getMetadata")
        assert recording["processingState"] == "getMetadata"
        user.has_no_tracks(recording)

        # Move job to next stage.
        file_processing.put(recording, success=True, complete=False)
        check_recording(user, recording, processingState="toMp4")

        # Now finalise processing.
        file_processing.put(
            recording, success=True, complete=True, new_object_key="some_key"
        )
        check_recording(user, recording, processingState="FINISHED", fileKey="some_key")

        track, tag = self.add_tracks_and_tag(file_processing, recording)
        user.can_see_track(track, [tag])


def check_recording(user, recording, **expected):
    r = user.get_recording(recording)
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
