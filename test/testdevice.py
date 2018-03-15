import datetime

class TestDevice:

    def __init__(self, devicename, deviceapi):
        self._deviceapi = deviceapi
        self.devicename = devicename

    def upload_recording(self):
        recordingtime = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S") + ".000Z"
        props = '{"recordingDateTime": "' + recordingtime + '", "type": "thermalRaw","duration": 10}'
        self._deviceapi.upload_recording('files/small.cptv', props)

