-- Delete recordings older than a certain date which have no tracks and no recording tags.
begin;
with no_tracks_or_tags as (
    select r.id
    from "Recordings" r
    left outer join "Tracks" t on r.id = t."RecordingId"
    left outer join "Tags" tags on r.id = tags."RecordingId"
    join "Devices" d on r."DeviceId" = d.id
    where r."recordingDateTime" < '2019-01-01'
    and r.type = 'thermalRaw'
    group by r.id
    having count(t.*) = 0 and count(tags.*) = 0
)
delete from "Recordings" where id in (select id from no_tracks_or_tags);
