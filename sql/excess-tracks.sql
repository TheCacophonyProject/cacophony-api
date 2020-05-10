-- Delete recordings with with 8 or more tracks for a given device
begin;
delete from "Recordings" where id in (
  select r.id
  from (
      select *
      from "Recordings"
      where type = 'thermalRaw'
      and "additionalMetadata" ? 'tracks'
      and not ("additionalMetadata"@> '{"tracks": {}}')
  ) r,
  "Devices" d
  where jsonb_array_length("additionalMetadata"->'tracks') >= 8
  and r."DeviceId" = d.id
  and devicename = 'somedevice'
);
