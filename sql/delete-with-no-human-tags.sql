-- Delete approximately half the recordings for a specific device that
-- haven't been tagged by a human (thinning out).
with recs as (
    select r.id
    from "Recordings" r
    join "Devices" d on r."DeviceId" = d.id
    where d.devicename = 'somedevice'
),
human_tagged as (
    select distinct r.id
    from recs r
    join "Tags" t on r.id = t."RecordingId"
    where not t.automatic
),
human_track_tagged as (
    select distinct r.id
    from recs r
    join "Tracks" t on r.id = t."RecordingId"
    join "TrackTags" tt on t.id = tt."TrackId"
    where not tt.automatic
),
all_human_tagged as (
    select distinct * from (
        select * from human_tagged
        union
        select * from human_track_tagged
    ) t
)
delete from "Recordings" r
where r.id in (select id from recs)
and r.id not in (select id from all_human_tagged)
and random() > 0.5;
