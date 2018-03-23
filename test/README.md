# Cacophony API tests

# Configuration

These tests can be run against any api server.

By default they use 
* http://127.0.0.1:1080
* with a superuser with name and password of 'admin_test'

This can be changed by creating a file called testconfig.json.  See config.py for more details. 

# To run all tests

* Create a virtualenv using your preferred method.
* Install dependencies: `pip install -r requirements.txt`
* Run with: `pytest -s`


# To create a separate server for testing

Create a new minio server
* Run a second minio server in another folder (so you can delete the data by just deleting the folder)
  - `./minio server <folder> --address :9001`
* Create the 'cacophony' bucket
  - `./mc config host add myminio http://10.0.2.15:9001 ....`
  - `./mc mb myminio/cacophony`

Create a new database called 'cacophonytest'
* Create database in PSQL
  - `sudo -i -u postgres`
  - `psql`
  - `CREATE DATABASE cacophonytest WITH OWNER [username];`
  - `\c [database]`
  - `CREATE EXTENSION postgis;`
  - `\q`

Migrate the database to the latest version
* Copy the app.js from the 'config' directory to the 'test/config'
  - In database.js change the database name `cacophonytest`
  - In server.js change server.port of the server to `1080`
  - In server.js change fileprocessing.port of the server to `2008`
  - In server.js change the endpoint of the s3 server to `9001`

* Migrate the database
  - from the parent folder (cacophony-api) run `node_modules/sequelize-cli/bin/sequelize db:migrate --config test/config/database.js`

Make the test user a super user
* Run one test - this will create the test user `admin_test` and group `test-group`
* Make admin-test a superuser
  - `psql update "Users" set superuser = true where username = 'admin_test'`


