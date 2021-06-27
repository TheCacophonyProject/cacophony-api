import json
import os
import requests
from collections import defaultdict
from requests_toolbelt.multipart.encoder import MultipartEncoder
from urllib.parse import urljoin
from datetime import datetime

from .testexception import raise_specific_exception
from .apibase import APIBase
from typing import List
from .testdevice import TestDevice


class UserAPI(APIBase):
    def __init__(self, baseurl, username, email, password="password"):
        super().__init__("user", baseurl, username, password)
        self.postdata["email"] = email
        self.email = email

    def register_as_new(self):
        return super().register_as_new(email=self.email)

    def login(self):
        return super().login(email=self.email)

    def admin_login_as_other_user(self, username):
        return super().admin_login_as_other_user(username)

    def list_users(self):
        url = urljoin(self._baseurl, "/api/v1/listUsers")
        response = requests.get(url, headers=self._auth_header)
        if response.status_code == 200:
            return response
        raise_specific_exception(response)

    def token(self, access=None, set_token=False):
        post_data = {}
        if access is not None:
            post_data["access"] = access

        response = requests.post(urljoin(self._baseurl, "/token"), headers=self._auth_header, json=post_data)
        json_response = self._check_response(response)

        if set_token:
            self._auth_header["Authorization"] = "JWT " + json_response["token"]
        return json_response

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
        deviceIds=None,
        return_json=False,
        where=None,
    ):
        if where is None:
            where = defaultdict(dict)
        where["duration"] = {"$gte": min_secs}
        if startDate is not None:
            where["recordingDateTime"]["$gte"] = startDate.isoformat()
        if endDate is not None:
            where["recordingDateTime"]["$lte"] = endDate.isoformat()
        if deviceIds is not None:
            where["DeviceId"] = deviceIds

        return self._query(
            "recordings",
            where=where,
            limit=limit,
            offset=offset,
            tagMode=tagmode,
            tags=tags,
            filterOptions=filterOptions,
            return_json=return_json,
        )

    def query_visits(
        self,
        startDate=None,
        endDate=None,
        min_secs=0,
        limit=100,
        offset=0,
        tagmode=None,
        tags=None,
        filterOptions=None,
        deviceIds=None,
        return_json=True,
        where=None,
    ):
        if where is None:
            where = defaultdict(dict)
        where["duration"] = {"$gte": min_secs}
        if startDate is not None:
            where["recordingDateTime"]["$gte"] = startDate.isoformat()
        if endDate is not None:
            where["recordingDateTime"]["$lte"] = endDate.isoformat()
        if deviceIds is not None:
            where["DeviceId"] = deviceIds
        return self._query(
            "recordings/visits",
            where=where,
            limit=limit,
            offset=offset,
            tagMode=tagmode,
            tags=tags,
            filterOptions=filterOptions,
            return_json=return_json,
        )

    def report(
        self,
        startDate=None,
        endDate=None,
        min_secs=0,
        limit=100,
        offset=0,
        tagmode=None,
        tags=None,
        filterOptions=None,
        deviceIds=None,
        jwt=None,
        report_type=None,
        audiobait=None,
    ):
        where = defaultdict(dict)
        where["duration"] = {"$gte": min_secs}
        if startDate is not None:
            where["recordingDateTime"]["$gte"] = startDate.isoformat()
        if endDate is not None:
            where["recordingDateTime"]["$lte"] = endDate.isoformat()
        if deviceIds is not None:
            where["DeviceId"] = deviceIds

        url = urljoin(self._baseurl, "/api/v1/recordings/report")
        params = {
            "where": where,
            "limit": limit,
            "offset": offset,
            "tagMode": tagmode,
            "tags": tags,
            "filterOptions": filterOptions,
        }

        if audiobait is not None:
            params["audiobait"] = audiobait

        if report_type:
            params["type"] = report_type

        if jwt:
            params["jwt"] = jwt
            headers = None
        else:
            headers = self._auth_header

        response = requests.get(url, params=serialise_params(params), headers=headers)
        if response.status_code == 200:
            return response.text
        raise_specific_exception(response)

    def update_user(self, body):
        url = urljoin(self._baseurl, "/api/v1/users")
        response = requests.patch(url, data=body, headers=self._auth_header)
        self._check_response(response)

    def get_recording(self, recording_id, params=None):
        return self.get_recording_response(recording_id, params)["recording"]

    def get_recording_needs_tag(self, device_id=None):
        if device_id is not None:
            request = "/api/v1/recordings/needs-tag?deviceId={}".format(device_id)
        else:
            request = "/api/v1/recordings/needs-tag"
        url = urljoin(self._baseurl, request)
        r = requests.get(url, headers=self._auth_header, params=None)
        return self._check_response(r)

    def get_recording_response(self, recording_id, params=None):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(recording_id))
        r = requests.get(url, headers=self._auth_header, params=params)
        return self._check_response(r)

    def delete_recording(self, recording_id):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(recording_id))
        r = requests.delete(url, headers=self._auth_header)
        return self._check_response(r)

    def update_recording(self, recording_id, updates):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(recording_id))
        r = requests.patch(url, headers=self._auth_header, data={"updates": json.dumps(updates)})
        return self._check_response(r)

    def reprocess(self, recording_id, params=None):
        reprocessURL = urljoin(self._baseurl, "/api/v1/reprocess/{}".format(recording_id))
        r = requests.get(reprocessURL, headers=self._auth_header, params=params)
        return self._check_response(r)

    def reprocess_recordings(self, recordings, params=None):
        reprocessURL = urljoin(self._baseurl, "/api/v1/reprocess")
        r = requests.post(
            reprocessURL, headers=self._auth_header, data={"recordings": json.dumps(recordings)}
        )
        return r.status_code, r.json()

    def download_cptv(self, recording_id):
        return self._download_recording(recording_id, "downloadRawJWT")

    def _download_recording(self, id, jwt_key):
        url = urljoin(self._baseurl, "/api/v1/recordings/{}".format(id))
        r = requests.get(url, headers=self._auth_header)
        d = self._check_response(r)
        return self._download_signed(d[jwt_key])

    def _get_all(self, url):
        r = requests.get(urljoin(self._baseurl, url), params={"where": "{}"}, headers=self._auth_header)
        if r.status_code == 200:
            return r.json()
        raise_specific_exception(r)

    def query_devices(self, devices: List[TestDevice] = None, groups: List[str] = None, operator=None):
        query = defaultdict(dict)
        if devices:
            query["devices"] = [
                {"devicename": device.devicename, "groupname": device.group} for device in devices
            ]
        if groups:
            query["groups"] = groups
        if operator:
            query["operator"] = operator

        url = urljoin(self._baseurl, "/api/v1/devices/query")
        r = requests.get(url, headers=self._auth_header, params=serialise_params(query))
        return self._check_response(r)

    def get_devices_as_json(self):
        return self._get_all("/api/v1/devices")["devices"]["rows"]

    def get_devices_as_string(self):
        return json.dumps(self.get_devices_as_json())

    def get_groups_as_string(self):
        return json.dumps(self._get_all("/api/v1/groups"))

    def get_device_id(self, devicename, groupId):
        all_devices = self._get_all("/api/v1/devices")["devices"]["rows"]
        for device in all_devices:
            if device["GroupId"] == groupId and device["devicename"] == devicename:
                return device["id"]
        return None

    def create_group(self, groupname):
        url = urljoin(self._baseurl, "/api/v1/groups")
        response = requests.post(url, headers=self._auth_header, data={"groupname": groupname})
        self._check_response(response)
        return response.json()

    def get_user_details(self, username):
        url = urljoin(self._baseurl, "/api/v1/users/{}".format(username))
        response = requests.get(url, headers=self._auth_header)
        return response.json()

    def tag_recording(self, recording_id, tagDictionary):
        url = urljoin(self._baseurl, "/api/v1/tags/")
        tagData = {"tag": json.dumps(tagDictionary), "recordingId": recording_id}
        response = requests.post(url, headers=self._auth_header, data=tagData)
        return self._check_response(response)

    def delete_recording_tag(self, tag_id):
        tagData = {"tagId": tag_id}
        response = requests.delete(
            urljoin(self._baseurl, "/api/v1/tags".format(tag_id)), headers=self._auth_header, data=tagData
        )
        return self._check_response(response)["messages"]

    def query_event_errors(self, deviceId=None, startTime=None, endTime=None, limit=20):
        return self._query(
            "events/errors", deviceId=deviceId, startTime=startTime, endTime=endTime, limit=limit
        )

    def query_events(self, deviceId=None, startTime=None, endTime=None, type=None, limit=20, latest=None):

        return self._query(
            "events",
            deviceId=deviceId,
            startTime=startTime,
            endTime=endTime,
            limit=limit,
            type=type,
            latest=latest,
        )

    def query_files(self, where=None, limit=None, offset=None):
        if where is None:
            where = {}
        return self._query("files", where=where, limit=limit, offset=offset)

    def _do_delete(self, deleteType, id):
        url = urljoin(self._baseurl, "/api/v1/{}/{}".format(deleteType, id))
        response = requests.delete(url, headers=self._auth_header)
        return self._check_response(response)

    def _query(self, queryname, **params):
        url = urljoin(self._baseurl, "/api/v1/" + queryname)
        params.setdefault("limit", 100)
        params.setdefault("offset", 0)
        return_json = params.pop("return_json", False)

        response = requests.get(url, params=serialise_params(params), headers=self._auth_header)
        if response.status_code == 200:
            if return_json:
                return response.json()
            else:
                return response.json()["rows"]
        raise_specific_exception(response)

    def upload_file(self, filename, props):
        url = urljoin(self._baseurl, "api/v1/files")
        json_props = json.dumps(props)

        with open(filename, "rb") as content:
            multipart_data = MultipartEncoder(
                fields={"data": json_props, "file": (os.path.basename(filename), content)}
            )
            headers = {"Content-Type": multipart_data.content_type, "Authorization": self._token}
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

    def get_audio_schedule(self, deviceID):
        url = urljoin(self._baseurl, "/api/v1/schedules/{}".format(deviceID))
        response = requests.get(url, headers=self._auth_header)
        self._check_response(response)
        return response.json()

    def upload_recording_for(self, groupname, devicename, filename, props=None):
        if not props:
            props = {"type": "thermalRaw"}
        endpoint = "device/{}".format(devicename)
        if groupname:
            endpoint += "/group/{}".format(groupname)
        return self._upload("/api/v1/recordings/{}".format(endpoint), filename, props)

    def legacy_upload_recording_for(self, devicename, filename, props=None):
        print("legacy_upload_recording_for:", devicename)
        if not props:
            props = {"type": "thermalRaw"}
        return self._upload("/api/v1/recordings/{}".format(devicename), filename, props)

    def set_global_permission(self, user, permission):
        url = urljoin(self._baseurl, "/api/v1/admin/global_permission/" + user)
        response = requests.patch(url, headers=self._auth_header, data={"permission": permission})
        self._check_response(response)

    def add_user_to_group(self, newuser, groupname):
        url = urljoin(self._baseurl, "/api/v1/groups/users")
        props = {"group": groupname, "username": newuser.username, "admin": "false"}
        response = requests.post(url, headers=self._auth_header, data=props)
        self._check_response(response)

    def add_to_group_as_group_admin(self, newuser, groupname):
        url = urljoin(self._baseurl, "/api/v1/groups/users")
        props = {"group": groupname, "username": newuser.username, "admin": "true"}
        response = requests.post(url, headers=self._auth_header, data=props)
        self._check_response(response)

    def remove_user_from_group(self, olduser, groupname):
        url = urljoin(self._baseurl, "/api/v1/groups/users")
        props = {"group": groupname, "username": olduser.username}
        response = requests.delete(url, headers=self._auth_header, data=props)
        self._check_response(response)

    def add_stations_to_group(self, group_id_or_name, stations, fromDate=None):
        url = urljoin(self._baseurl, "/api/v1/groups/{}/stations".format(group_id_or_name))
        props = {}
        if stations is not None:
            props["stations"] = stations
        if fromDate is not None:
            props["fromDate"] = fromDate
        response = requests.post(url, headers=self._auth_header, data=props)
        self._check_response(response)
        return response.json()

    def get_stations_for_group(self, group_id_or_name):
        url = urljoin(self._baseurl, "/api/v1/groups/{}/stations".format(group_id_or_name))
        response = requests.get(url, headers=self._auth_header)
        self._check_response(response)
        return response.json()

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
        response = requests.get(url, headers=self._auth_header, params={"deviceId": deviceid})
        return self._check_response(response).get("rows", [])

    def add_track(self, recording_id, data, algorithm={"status": "Test added"}):
        response = requests.post(
            urljoin(self._baseurl, "/api/v1/recordings/{}/tracks".format(recording_id)),
            headers=self._auth_header,
            data={"algorithm": json.dumps(algorithm), "data": json.dumps(data)},
        )
        return self._check_response(response)["trackId"]

    def get_tracks(self, recording_id):
        response = requests.get(
            urljoin(self._baseurl, "/api/v1/recordings/{}/tracks".format(recording_id)),
            headers=self._auth_header,
        )
        return self._check_response(response)["tracks"]

    def delete_track(self, recording_id, track_id):
        response = requests.delete(
            urljoin(self._baseurl, "/api/v1/recordings/{}/tracks/{}".format(recording_id, track_id)),
            headers=self._auth_header,
        )
        return self._check_response(response)["messages"]

    def add_track_tag(
        self, recording_id, track_id, what, confidence, automatic, data, replace=False, tag_jwt=None
    ):
        url = "/api/v1/recordings/{}/tracks/{}/"
        if replace:
            url += "replaceTag"
        else:
            url += "tags"
        tag_data = {
            "what": what,
            "confidence": confidence,
            "automatic": "true" if automatic else "false",
            "data": json.dumps(data),
        }
        if tag_jwt is not None:
            tag_data["tagJWT"] = tag_jwt

        response = requests.post(
            urljoin(self._baseurl, url.format(recording_id, track_id)),
            headers=self._auth_header,
            data=tag_data,
        )
        return self._check_response(response)["trackTagId"]

    def delete_track_tag(self, recording_id, track_id, track_tag_id, tag_jwt=None):
        if tag_jwt is not None:
            url = "/api/v1/recordings/{}/tracks/{}/tags/{}?tagJWT={}".format(
                recording_id, track_id, track_tag_id, tag_jwt
            )
        else:
            url = "/api/v1/recordings/{}/tracks/{}/tags/{}".format(recording_id, track_id, track_tag_id)

        response = requests.delete(urljoin(self._baseurl, url), headers=self._auth_header)
        return self._check_response(response)["messages"]

    def record_event(self, device, type_, details, times=None):
        data = {"description": {"type": type_, "details": details}}
        return self.record_event_data(device, data, times)

    def record_event_data(self, device, eventData, times=None):
        if times is None:
            times = [datetime.now()]
        eventData["dateTimes"] = [t.isoformat() for t in times]
        url = urljoin(self._baseurl, "/api/v1/events/device/" + str(device._id))

        response = requests.post(url, headers=self._auth_header, json=eventData)
        response_data = self._check_response(response)
        return response_data["eventsAdded"], response_data["eventDetailId"]

    def get_cacophony_index(self, device_id, from_time=None, window_size=None):
        url = urljoin(self._baseurl, f"/api/v1/devices/{device_id}/cacophony-index")
        response = requests.get(
            url, headers=self._auth_header, params={"from": from_time, "window-size": window_size}
        )
        self._check_response(response)
        return response.json()

    def get_cacophony_index_histogram(self, device_id, from_time=None, window_size=None):
        url = urljoin(self._baseurl, f"/api/v1/devices/{device_id}/cacophony-index-histogram")
        response = requests.get(
            url, headers=self._auth_header, params={"from": from_time, "window-size": window_size}
        )
        self._check_response(response)
        return response.json()

    def create_alert(self, name, conditions, device_id, frequency=None):
        props = {"name": name, "conditions": json.dumps(conditions), "deviceId": device_id}
        if frequency is not None:
            props["frequencySeconds"] = frequency
        response = requests.post(
            urljoin(self._baseurl, "/api/v1/alerts"),
            headers=self._auth_header,
            data=props,
        )
        return self._check_response(response)["id"]

    def get_alerts(self, device_id):
        response = requests.get(
            urljoin(self._baseurl, f"/api/v1/alerts/device/{device_id}"),
            headers=self._auth_header,
            data={"deviceId": device_id},
        )
        self._check_response(response)
        return response.json()["Alerts"]


def serialise_params(params):
    out = {}
    for name, value in params.items():
        if value is not None:
            if isinstance(value, (dict, list, tuple)):
                value = json.dumps(value)
            elif isinstance(value, datetime):
                value = value.isoformat()
            out[name] = value
    return out
