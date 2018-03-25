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


# Create separate infrastructure for testing

## Create a new Minio server

* Run a second minio server in another folder (so you can delete the data by just deleting the folder)
  - `./minio server <folder> --address :9001`
* Create the 'cacophony' bucket
  - `./mc config host add myminio http://10.0.2.15:9001 ....`
  - `./mc mb myminio/cacophony`

## Create a test PostgreSQL database

Create database in PSQL:

- `sudo -i -u postgres`
- `psql`
- `CREATE DATABASE cacophonytest WITH OWNER [username];`
- `\c [database]`
- `CREATE EXTENSION postgis;`
- `\q`

## Create server configuration

Copy `config/app_test_TEMPLATE.js` to `config/app_test.js` and fill in
the required parts.

## Populate/update the database

From the project's root folder (cacophony-api) run:

```
node_modules/sequelize-cli/bin/sequelize db:migrate --config config/app_test.js`
```

## Start test API server

```
node Server --config=config/app_test.js
```

## Make the test user a super user

* Run one test - this will create the test user `admin_test` and group `test-group`
* Make admin-test a superuser: `echo "update \"Users\" set superuser = true where username = 'admin_test'" | sudo -u postgres psql cacophonytest`
