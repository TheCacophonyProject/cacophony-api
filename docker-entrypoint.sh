#!/bin/bash
set -e

echo "---- Starting Minio ----"
export MINIO_ACCESS_KEY=minio
export MINIO_SECRET_KEY=miniostorage
./minio server --address :9001 .data &> minio.log &

echo "---- Starting PostgreSQL ----"
service postgresql start

sudo -i -u postgres psql -c "CREATE USER test with password 'test'"
sudo -i -u postgres psql -c "CREATE DATABASE cacophonytest WITH OWNER test;"
sudo -i -u postgres psql cacophonytest -c "CREATE EXTENSION postgis"

echo "---- Setting up Minio ----"
./mc config host add myminio http://127.0.0.1:9001 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
./mc mb myminio/cacophony

echo "mc done"

if [[ $ISOLATE -eq 1 ]]; then
    cp -r /app app-isolated
    echo "---- Installing npm dependencies ----"
    cd /app-isolated
    npm install
    npm run apidoc
else
    cd /app
fi


echo "---- Migrating database ----"
node_modules/.bin/sequelize db:migrate --config config/app_test_default.js
sudo -i -u postgres psql cacophonytest -f /app/test/db-seed.sql

echo "alias psqltest='sudo -i -u postgres psql cacophonytest'" > ~/.bashrc

$NODE_BIN Server.js --config=config/app_test_default.js
