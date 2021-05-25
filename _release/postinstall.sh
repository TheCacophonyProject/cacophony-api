#!/bin/bash

section() {
    echo ">>>> $1"
}

set -e

section "Stopping API server"
systemctl stop cacophony-api &> /dev/null

cd /srv/cacophony/api

if [[ ! -h config/app.js ]]; then
    section "Moving configuration to /etc/cacophony"
    mv config/app.js /etc/cacophony/api.js
    ln -s /etc/cacophony/api.js config/app.js
fi

if [[ `stat -c '%U' node_modules` != "fullnoise" ]]; then
    section "Removing outdated node_modules directory"
    rm -rf node_modules
    mkdir node_modules
    chown fullnoise:fullnoise node_modules
    chown fullnoise:fullnoise package-lock.json
fi
chown fullnoise:fullnoise package-lock.json
section "Installing dependencies"
su fullnoise -s /bin/sh -c "npm install"

section "Pruning unused dependencies"
su fullnoise -s /bin/sh -c "npm prune"

#Only run migrations if we have write access to the database!
if [ "$HOSTNAME" != "processing02" ]; then
    section "Running database migrations"
    npm run db-migrate
fi

section "Creating API docs"
npm run apidoc

section "Restarting API server"
systemctl daemon-reload
systemctl start cacophony-api
systemctl --no-pager status cacophony-api
