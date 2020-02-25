COPY (
select * from (
  select
     "DeviceId" as device_id,
     ST_X(location) AS longitude,
     ST_Y(location) AS latitude,
     id as recording_id,
     "recordingDateTime" as timestamp,
     (select round(avg((value->>'index_percent')::numeric), 1) from jsonb_array_elements("additionalMetadata"->'analysis'->'cacophony_index')) as cacophony_index
  from "Recordings"
  where type = 'audio'
  and "DeviceId" = 640
  order by id desc
  limit 5000
) r
order by recording_id
) TO '/tmp/cacophony_index_extract.csv' WITH CSV HEADER;
