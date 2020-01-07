class Recording:
    def __init__(self, id_, props, content_filename, recording_name=""):
        self.id_ = id_
        self.props = props
        self.content = slurp(content_filename)
        # A name that describes the recording.
        # This will be printed out if a recordings query gives unexpected results.
        self.name = recording_name

        self.tags = []
        self.tracks = []

    def __repr__(self):
        return "<Recording: {}>".format(self.id_)

    def __getitem__(self, name):
        return self.props[name]

    def __setitem__(self, name, value):
        self.props[name] = value

    def __iter__(self):
        return iter(self.props)

    def is_tagged_as(self, **data):
        return TagPromise(self, data)


class TagPromise:
    def __init__(self, recording, tag):
        self._recording = recording
        if tag.get("what") == "false positive":
            tag["detail"] = "false positive"
            del tag["what"]
        self._tag = tag

    def by(self, user):
        self._recording.tags.append(self._tag)
        return user.tag_recording(self._recording, self._tag)

    def byAI(self, user):
        self._tag["automatic"] = True
        self._recording.tags.append(self._tag)
        return user.tag_recording(self._recording, self._tag)


def slurp(filename):
    if not filename:
        return None
    with open(filename, "rb") as f:
        return f.read()
