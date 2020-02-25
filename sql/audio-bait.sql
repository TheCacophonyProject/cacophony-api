-- Extract the audiobait events for a specific set of devices and time range as a CSV file.
COPY (
select e."dateTime", f.details->>'name' as name, d.details->>'volume' as volume
from "Events" e
join "DetailSnapshots" d on e."EventDetailId" = d.id
join "Files" f on (d.details->>'fileId')::int = f.id
where "DeviceId" in (select id from "Devices" where devicename in ('device01','device02','device03'))
and d.type = 'audioBait'
and "dateTime" > '2019-10-01 17:00'
and "dateTime" < '2019-10-12 07:00'
order by "dateTime"
) TO '/tmp/audio.csv' with CSV HEADER;
