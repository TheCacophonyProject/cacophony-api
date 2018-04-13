class TestRecording:
    def __init__(self, recordingId, props, content):
        self.recordingId = recordingId
        self.props = props
        self.content = content

    def __repr__(self):
        return "<TestRecording: {}>".format(self.recordingId)

    def is_tagged_as(self, animal):
        return TestTagPromise(self, animal)


class TestTagPromise():
    def __init__(self, testrecording, animal):
        self._testrecording = testrecording
        self._tagData = {"animal": animal}
        print("  which is tagged as a {}".format(animal), end='')

    def by(self, testuser):
        print(" by {}".format(testuser.username))
        testuser.tag_recording(self._testrecording.recordingId, self._tagData)
        return self._testrecording

    def byAI(self, testuser):
        print(" by {}".format("by AI"))
        self._tagData['automatic'] = True

        testuser.tag_recording(self._testrecording.recordingId, self._tagData)
        return self._testrecording
