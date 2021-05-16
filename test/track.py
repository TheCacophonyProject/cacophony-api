import random

import attr


@attr.s
class Track:
    id_ = attr.ib()
    recording = attr.ib(eq=False)  # avoid cycles during comparsion
    data = attr.ib()
    tags = attr.ib(factory=list)

    @classmethod
    def create(cls, recording, start_s=10, length=10):
        "Make a TestTrack with some plausible data."
        return cls(
            None, recording, data={"foo": [[1, 2], [3, 4]], "start_s": start_s, "end_s": start_s + length}
        )


@attr.s
class TrackTag:
    id_ = attr.ib()
    track = attr.ib(eq=False)  # avoid cycles during comparsion
    what = attr.ib()
    confidence = attr.ib()
    automatic = attr.ib()
    data = attr.ib()

    MASTER_TAG = "Master"

    @classmethod
    def create(cls, track, automatic=None, what=None, data=None, ai_name=None):
        "Make a TestTrackTag with some plausible data."
        if automatic is None:
            automatic = random.choice([True, False])
        if what is None:
            what = random.choice(["possum", "rat", "stoat"])
        if data is None:
            data = random.choice([{"foo": 1}, {"bar": 2}, {"what": 3}])
        if automatic and "name" not in data:
            data["name"] = TrackTag.MASTER_TAG if ai_name is None else ai_name

        return cls(
            id_=None,
            track=track,
            what=what,
            confidence=random.choice([0.5, 0.8, 0.9]),
            automatic=automatic,
            data=data,
        )
