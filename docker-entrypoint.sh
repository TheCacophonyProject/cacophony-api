#!/bin/bash

set -e

cd /

echo "---- Starting Minio ----"
./minio server --address :9001 .data &> minio.log &


echo "---- Starting PostgreSQL ----"
service postgresql start

sudo -i -u postgres psql -c "CREATE USER test with password 'test'"
sudo -i -u postgres psql -c "CREATE DATABASE cacophonytest WITH OWNER test;"
sudo -i -u postgres psql cacophonytest -c "CREATE EXTENSION postgis"
sudo -i -u postgres psql cacophonytest -c "CREATE EXTENSION citext"

echo "---- Setting up Minio ----"
./mc config host add myminio http://127.0.0.1:9001 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
./mc mb myminio/cacophony

cd /app

echo "---- Migrating database ----"
node_modules/.bin/sequelize db:migrate --config config/app_test_default.js
sudo -i -u postgres psql cacophonytest -f /app/test/db-seed.sql

echo "alias psqltest='sudo -i -u postgres psql cacophonytest'" > ~/.bashrc

echo "---- Compiling typescript and starting module ----"
./node_modules/.bin/tsc
./node_modules/.bin/tsc-watch --noClear --onSuccess "node Server.js --config=config/app_test_default.js"
