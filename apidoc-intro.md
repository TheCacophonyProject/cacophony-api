# Introduction

The Cacophony Project API can be used to upload recorded by various devices
(i.e. Cacophonometers and Cacophononators) and retrieve them later. Both sound
and video recordings are supported. The API uses a
[REST](https://en.wikipedia.org/wiki/Representational_state_transfer) style.

## Users, Groups and Devices

The API supports two types of clients: users and devices. User accounts are
used for human facing applications, while device accounts are used by
unattended devices which interact with the API.

Users are members of one or more groups. A device is always owned by exactly
one group. The current support for groups is limited but will be expanded in
future versions of the API.

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. A valid JWT must be
provided in the `Authorization` header to most requests to the API. To obtain a
token, the [/authenticate_user](#api-Authentication-AuthenticateUser) or 
[/authenticate_device](#api-Authentication-AuthenticateDevice) APIs must be
used. When these requests are successful they each return a JWT.

## Creating Accounts

New user accounts can be created using the
[/api/v1/users](#api-User-RegisterUser) API. New device accounts can be created
using the [/api/v1/devices](#api-Device-RegisterDevice) API.

These APIs do not require authentication, allowing users and devices to
self-register.

## Feedback & Bug Reports

Problems using the API, errors in the documentation and suggestions
for improvement can be made by either filing an issue on the
[Github project](https://github.com/TheCacophonyProject/Full_Noise)
or by using the
[project mailing list](http://groups.nzoss.org.nz/groups/projectcacophony).
