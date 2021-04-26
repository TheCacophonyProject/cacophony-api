SELECT
    DISTINCT ON("Event"."DeviceId", "EventDetail"."type") 1,
    "Event"."id",
    "Event"."dateTime",
    "Event"."DeviceId",
    "EventDetail"."id" AS "EventDetail.id",
    "EventDetail"."type" AS "EventDetail.type",
    "EventDetail"."details" AS "EventDetail.details",
    "Device"."id" AS "Device.id",
    "Device"."devicename" AS "Device.devicename",
    "Device"."GroupId" AS "Device.GroupId",
    "Device->Group"."id" AS "Device.Group.id",
    "Device->Group"."groupname" AS "Device.Group.groupname"
FROM
    "Events" AS "Event"
    INNER JOIN "DetailSnapshots" AS "EventDetail" ON "Event"."EventDetailId" = "EventDetail"."id"
    AND "EventDetail"."type" IN (
        'rpi-power-on',
        'daytime-power-off',
        'stop-reported'
    )
    LEFT OUTER JOIN "Devices" AS "Device" ON "Event"."DeviceId" = "Device"."id"
    LEFT OUTER JOIN "Groups" AS "Device->Group" ON "Device"."GroupId" = "Device->Group"."id"
WHERE
    (
        "Event"."DeviceId" = '9'
        AND "Event"."DeviceId" IN (1, 2, 3, 4, 5, 6, 7, 8, 9)
    )
ORDER BY
    "EventDetail"."type" DESC,
    "Event"."DeviceId" DESC,
    "Event"."dateTime" DESC