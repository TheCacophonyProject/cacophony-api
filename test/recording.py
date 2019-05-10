class Recording:
    def __init__(self, id_, props, content_filename, recording_name=''):
        self.id_ = id_
        self.props = props
        self.content = slurp(content_filename)
        # A name that describes the recording.
        # This will be printed out if a recordings query gives unexpected results.
        self.name = recording_name

    def __repr__(self):
        return "<Recording: {}>".format(self.id_)

    def __getitem__(self, name):
        return self.props[name]

    def __setitem__(self, name, value):
        self.props[name] = value

    def is_tagged_as(self, animal):
        return TagPromise(self, animal)


class TagPromise:
    def __init__(self, recording, animal):
        self._recording = recording
        if animal == 'false positive':
            self._tag_data = {"event": 'false positive'}
        else:
            self._tag_data = {"animal": animal}
        print("  which is tagged as a {}".format(animal), end="")

    def by(self, user):
        print(" by {}".format(user.username))
        return user.tag_recording(self._recording, self._tag_data)

    def byAI(self, user):
        print(" by {}".format("by AI"))
        self._tag_data["automatic"] = True
        return user.tag_recording(self._recording, self._tag_data)


def slurp(filename):
    if not filename:
        return None
    with open(filename, "rb") as f:
        return f.read()
