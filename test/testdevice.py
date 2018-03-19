import datetime
from testrecording import TestRecording

class TestDevice:

    def __init__(self, devicename, deviceapi):
        self._deviceapi = deviceapi
        self.devicename = devicename
        self._recordingtimeoffset = 24

    def has_recording(self):
        self._print_description("    and '{}' has a recording ".format(self.devicename))
        return self.upload_recording()

    def upload_recording(self):
        # recordings need to be recorded at different second times else the search code doesn't work
        recordingtime = datetime.datetime.utcnow() - datetime.timedelta(seconds=self._recordingtimeoffset)
        self._recordingtimeoffset -= 1

        timestr = recordingtime.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z"
        props = '{"recordingDateTime": "' + timestr + '", "type": "thermalRaw","duration": 10}'
        recordingId = self._deviceapi.upload_recording('files/small.cptv', props)
        print(" ({})".format(recordingId))
        return TestRecording(recordingId)

    def _print_description(self, description): 
        print(description, end='')        
