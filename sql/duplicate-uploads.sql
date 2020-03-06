-- Find duplicate audio recordings.
select d.devicename, r."recordingDateTime", count(*), string_agg(r.id::text, ' ')
from "Recordings" r join "Devices" d on r."DeviceId" = d.id
where type = 'audio'
group by d."devicename", r.duration, r."recordingDateTime"
having count(*) > 1
order by r."recordingDateTime" desc;

-- Find duplicate thermal video recordings.
with dups as (
  select d.devicename, r."recordingDateTime", min(r.id)
  from "Recordings" r join "Devices" d on r."DeviceId" = d.id
  where type = 'thermalRaw'
  group by d."devicename", r.duration, r."recordingDateTime"
  having count(*) > 1
  order by r."recordingDateTime" desc
)
select * from dups;

-- Remove all duplicate recordings which haven't been touched in over an hour (i.e. not recent uploads).
WITH dups AS (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY "DeviceId", "recordingDateTime" ORDER BY id) as rownum
    FROM "Recordings"
    WHERE "updatedAt" < now() - INTERVAL '1 hour'
    AND "recordingDateTime" is NOT NULL
  ) d
  WHERE d.rownum > 1
)
DELETE FROM "Recordings"
WHERE id IN (SELECT id FROM dups)
RETURNING id, "DeviceId", "recordingDateTime";
