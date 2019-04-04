#!/bin/sh

echo "Running DB migrations..."
cd /srv/cacophony/api
npm run db-migrate
