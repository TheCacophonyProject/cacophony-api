#!/bin/sh

set -e -x

systemctl stop cacophony-api

cd /srv/cacophony/api
npm run db-migrate

systemctl daemon-reload
systemctl start cacophony-api
systemctl status cacophony-api
