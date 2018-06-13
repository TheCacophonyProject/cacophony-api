#!/bin/bash
set -e

echo "listen_addresses = '*'" >> /etc/postgresql/9.5/main/postgresql.conf

service postgresql restart

sudo -i -u postgres psql -c "CREATE USER test with password 'test'"
sudo -i -u postgres psql -c "CREATE DATABASE cacophonytest WITH OWNER test;"
sudo -i -u postgres psql cacophonytest -c "CREATE EXTENSION postgis"

echo "[hit enter key to exit] or run 'docker stop <container>'"

read
