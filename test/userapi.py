import json
import os
import requests
from collections import defaultdict
from requests_toolbelt.multipart.encoder import MultipartEncoder
from urllib.parse import urljoin

from .apibase import APIBase


class UserAPI(APIBase):
    def __init__(self, baseurl, username, email, password="password"):
        super().__init__("user", baseurl, username, password)
        self.email = email

    def register_as_new(self):
        return super().register_as_new(email=self.email)

    def login(self):
        return super().login(email=self.email)

    def name_or_email_login(self, nameOrEmail):
        url = urljoin(self._baseurl, "/authenticate_" + self._logintype)
        data = {"nameOrEmail": nameOrEmail, "password": self._password}
        response = requests.post(url, data=data)
        self.check_login_response(response)
        return self

    def query(
        self,
        startDate=None,
        endDate=None,
        min_secs=0,
        limit=100,
        offset=0,
        tagmode=None,
        tags=None,
        filterOptions=None,
    ):
        where = defaultdict(dict)
        where["duration"] = {"$gte": min_secs}
        if startDate is not None:
            where["recordingDateTime"]["$gte"] = startDate.isoformat()
        if endDate is not None:
            where["recordingDateTime"]["$lte"] = endDate.isoformat()
        params = {"where": json.dumps(where)}

        if tagmode is not None:
            params["tagMode"] = tagmode
        if tags is not None:
            params["tags"] = json.dumps(tags)

        return self._query_results("recordings", params, limit, offset, filterOptions)

    def get_recording(self, recording_id, params=None):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(recording_id))
        r = requests.get(url, headers=self._auth_header, params=params)
        return self._check_response(r)["recording"]

    def delete_recording(self, recording_id):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(recording_id))
        r = requests.delete(url, headers=self._auth_header)
        return self._check_response(r)

    def update_recording(self, recording_id, updates):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(recording_id))
        r = requests.patch(
            url, headers=self._auth_header, data={"updates": json.dumps(updates)}
        )
        return self._check_response(r)

    def download_cptv(self, recording_id):
        return self._download_recording(recording_id, "downloadRawJWT")

    def download_mp4(self, recording_id):
        return self._download_recording(recording_id, "downloadFileJWT")

    def _download_recording(self, id, jwt_key):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(id))
        r = requests.get(url, headers=self._auth_header)
        d = self._check_response(r)
        return self._download_signed(d[jwt_key])

    def query_audio(
        self, startDate=None, endDate=None, min_secs=0, limit=100, offset=0
    ):
        headers = self._auth_header.copy()

        where = defaultdict(dict)
        where["duration"] = {"$gte": min_secs}
        if startDate is not None:
            where["recordingDateTime"]["$gte"] = startDate.isoformat()
        if endDate is not None:
            where["recordingDateTime"]["$lte"] = endDate.isoformat()
        headers["where"] = json.dumps(where)

        if limit is not None:
            headers["limit"] = str(limit)
        if offset is not None:
            headers["offset"] = str(offset)

        url = urljoin(self._baseurl, "/api/v1/audiorecordings")
        r = requests.get(url, headers=headers)
        if r.status_code == 200:
            return r.json()["result"]["rows"]
        if r.status_code == 400:
            messages = r.json()["messages"]
            raise IOError("request failed ({}): {}".format(r.status_code, messages))
        r.raise_for_status()

    def get_audio(self, recording_id):
        url = urljoin(self._baseurl, "/api/v1/audiorecordings/{}".format(recording_id))

        r = requests.get(url, headers=self._auth_header)
        return self._check_response(r)

    def delete_audio(self, recording_id):
        url = urljoin(self._baseurl, "/api/v1/audiorecordings/{}".format(recording_id))
        r = requests.delete(url, headers=self._auth_header)
        return self._check_response(r)

    def update_audio_recording(self, recording_id, updates):
        url = urljoin(self._baseurl, "/api/v1/audiorecordings/{}".format(recording_id))
        r = requests.put(
            url, headers=self._auth_header, data={"data": json.dumps(updates)}
        )
        return self._check_response(r)

    def download_audio(self, recording_id):
        url = urljoin(self._baseurl, "/api/v1/audiorecordings/{}".format(recording_id))
        r = requests.get(url, headers=self._auth_header)
        d = self._check_response(r)
        return self._download_signed(d["jwt"])

    def _get_all(self, url):
        r = requests.get(
            urljoin(self._baseurl, url),
            params={"where": "{}"},
            headers=self._auth_header,
        )
        r.raise_for_status()
        return r.json()

    def get_devices_as_string(self):
        return json.dumps(self._get_all("/api/v1/devices"))

    def get_groups_as_string(self):
        return json.dumps(self._get_all("/api/v1/groups"))

    def get_device_id(self, devicename):
        all_devices = self._get_all("/api/v1/devices")["devices"]["rows"]
        for device in all_devices:
            if device["devicename"] == devicename:
                return device["id"]
        return None

    def create_group(self, groupname):
        url = urljoin(self._baseurl, "/api/v1/groups")
        response = requests.post(
            url, headers=self._auth_header, data={"groupname": groupname}
        )
        self._check_response(response)

    def get_user_details(self, username):
        url = urljoin(self._baseurl, "/api/v1/users/{}".format(username))
        response = requests.get(url, headers=self._auth_header)
        return response.json()

    def tag_recording(self, recordingId, tagDictionary):
        url = urljoin(self._baseurl, "/api/v1/tags/")
        tagData = {"tag": json.dumps(tagDictionary), "recordingId": recordingId}
        response = requests.post(url, headers=self._auth_header, data=tagData)
        response.raise_for_status()

    def query_events(self, limit=None, offset=None, deviceId=None):
        if deviceId is None:
            where = "{}"
        else:
            where = '{"DeviceId":' + "{}".format(deviceId) + "}"
        return self._query_results("events", {"where": where}, limit, offset)

    def query_files(self, where="{}", limit=None, offset=None):
        return self._query_results("files", {"where": where}, limit, offset)

    def _do_delete(self, deleteType, id):
        url = urljoin(self._baseurl, "/api/v1/{}/{}".format(deleteType, id))
        response = requests.delete(url, headers=self._auth_header)
        return self._check_response(response)

    def _query_results(
        self, queryname, params, limit=100, offset=0, filterOptions=None
    ):
        url = urljoin(self._baseurl, "/api/v1/" + queryname)

        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset
        if offset is not filterOptions:
            params["filterOptions"] = filterOptions

        response = requests.get(url, params=params, headers=self._auth_header)
        if response.status_code == 200:
            return response.json()["rows"]
        elif response.status_code == 400:
            messages = response.json()["messages"]
            raise IOError(
                "request failed ({}): {}".format(response.status_code, messages)
            )
        else:
            response.raise_for_status()

    def upload_file(self, filename, props):
        url = urljoin(self._baseurl, "api/v1/files")
        json_props = json.dumps(props)

        with open(filename, "rb") as content:
            multipart_data = MultipartEncoder(
                fields={
                    "data": json_props,
                    "file": (os.path.basename(filename), content),
                }
            )
            headers = {
                "Content-Type": multipart_data.content_type,
                "Authorization": self._token,
            }
            r = requests.post(url, data=multipart_data, headers=headers)
        self._check_response(r)
        return r.json()["recordingId"]

    def delete_file(self, file_id):
        self._do_delete("files", file_id)

    def upload_schedule(self, devicesIds, schedule):
        url = urljoin(self._baseurl, "api/v1/schedules")
        props = {"devices": json.dumps(devicesIds), "schedule": json.dumps(schedule)}
        response = requests.post(url, data=props, headers=self._auth_header)
        self._check_response(response)

    def get_audio_schedule(self, devicename):
        url = urljoin(self._baseurl, "/api/v1/schedules/{}".format(devicename))
        response = requests.get(url, headers=self._auth_header)
        self._check_response(response)
        return response.json()

    def upload_recording_for(self, devicename, filename, props=None):
        if not props:
            props = {"type": "thermalRaw"}
        return self._upload("/api/v1/recordings/{}".format(devicename), filename, props)

    def set_global_permission(self, user, permission):
        url = urljoin(self._baseurl, "/api/v1/admin/global_permission/" + user)
        response = requests.patch(
            url, headers=self._auth_header, data={"permission": permission}
        )
        self._check_response(response)

    def add_user_to_group(self, newuser, groupname):
        url = urljoin(self._baseurl, "/api/v1/groups/users")
        props = {"group": groupname, "username": newuser.username, "admin": "false"}
        response = requests.post(url, headers=self._auth_header, data=props)
        self._check_response(response)

    def remove_user_from_group(self, olduser, groupname):
        url = urljoin(self._baseurl, "/api/v1/groups/users")
        props = {"group": groupname, "username": olduser.username}
        response = requests.delete(url, headers=self._auth_header, data=props)
        self._check_response(response)

    def add_user_to_device(self, newuser, deviceid):
        url = urljoin(self._baseurl, "/api/v1/devices/users")
        props = {"deviceId": deviceid, "username": newuser.username, "admin": "false"}
        response = requests.post(url, headers=self._auth_header, data=props)
        self._check_response(response)

    def remove_user_from_device(self, olduser, deviceid):
        url = urljoin(self._baseurl, "/api/v1/devices/users")
        props = {"deviceId": deviceid, "username": olduser.username}
        response = requests.delete(url, headers=self._auth_header, data=props)
        self._check_response(response)

    def list_device_users(self, deviceid):
        url = urljoin(self._baseurl, "/api/v1/devices/users")
        response = requests.get(
            url, headers=self._auth_header, params={"deviceId": deviceid}
        )
        return self._check_response(response).get("rows", [])
