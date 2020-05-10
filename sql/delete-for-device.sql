delete from "Recordings"
where "DeviceId" = (select id from "Devices" where devicename = 'somedevice')
and id between 263759 and 303379;
