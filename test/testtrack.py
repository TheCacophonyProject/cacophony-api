import attr

@attr.s
class TestTrack:
    recording = attr.ib()
    algorithm = attr.ib()
    data = attr.ib()
    track_id = attr.ib(default=None)

@attr.s
class TestTrackTag:
    id_ = attr.ib()
    track = attr.ib()
    what = attr.ib()
    confidence = attr.ib()
    automatic = attr.ib()
    data = attr.ib()
