#!/bin/bash
set -e

service postgresql start

sudo -i -u postgres psql -c "CREATE USER test with password 'test'"
sudo -i -u postgres psql -c "CREATE DATABASE cacophonytest WITH OWNER test;"
sudo -i -u postgres psql cacophonytest -c "CREATE EXTENSION postgis"

echo "[hit enter key to exit] or run 'docker stop <container>'"

read
