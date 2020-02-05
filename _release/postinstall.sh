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
fi

section "Installing dependencies"
su fullnoise -s /bin/sh -c "npm install"

section "Pruning unused dependencies"
su fullnoise -s /bin/sh -c "npm prune"

section "Running database migrations"
npm run db-migrate

section "Creating API docs"
npm run apidoc

section "Restarting API server"
systemctl daemon-reload
systemctl start cacophony-api
systemctl --no-pager status cacophony-api
