#!/bin/bash
set -e

export MINIO_ACCESS_KEY=minio
export MINIO_SECRET_KEY=miniostorage
./minio server --address :9001 .data &> minio.log &

service postgresql start

sudo -i -u postgres psql -c "CREATE USER test with password 'test'"
sudo -i -u postgres psql -c "CREATE DATABASE cacophonytest WITH OWNER test;"
sudo -i -u postgres psql cacophonytest -c "CREATE EXTENSION postgis"

./mc config host add myminio http://127.0.0.1:9001 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
./mc mb myminio/cacophony

echo "[hit enter key to exit] or run 'docker stop <container>'"

read
