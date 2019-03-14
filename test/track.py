import random

import attr


@attr.s
class Track:
    id_ = attr.ib()
    recording = attr.ib()
    data = attr.ib()

    @classmethod
    def create(cls, recording):
        "Make a TestTrack with some plausible data."
        return cls(None, recording, data={"foo": [[1, 2], [3, 4]]})


@attr.s
class TrackTag:
    id_ = attr.ib()
    track = attr.ib()
    what = attr.ib()
    confidence = attr.ib()
    automatic = attr.ib()
    data = attr.ib()

    @classmethod
    def create(cls, track, automatic=None):
        "Make a TestTrackTag with some plausible data."
        if automatic is None:
            automatic = random.choice([True, False])
        return cls(
            id_=None,
            track=track,
            what=random.choice(["possum", "rat", "stoat"]),
            confidence=random.choice([0.5, 0.8, 0.9]),
            automatic=automatic,
            data=random.choice([["foo", 1], ["bar", 2], ["what", 3]]),
        )
