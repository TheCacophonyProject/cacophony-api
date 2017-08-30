# Full_Noise

Full_Noise is a node server that is used for viewing and uploading data for the cacophony project. It consists of a REST API and a basic web interface for viewing your data.

## Setup  
To setup Full_Noise you will need a PostgreSQL database and a LeoFS bucket setup first.

### LeoFS Setup

* Download LeoFS from https://leo-project.net/leofs/download.html
* Follow the installation instructions at https://leo-project.net/leofs/docs/installation/quick/
* Create a user saving the id and secret.
* Create a bucket for Full Noise to use: `leofs-adm add-bucket [bucket name] [access key]`
* Ensure that /etc/hosts has a `[bucket name].localhost` entry as described in the LeoFS documentation.

### PostgreSQL Setup
A postgreSQL user needs to bet setup as the ower of a database and the postgis extension needs to be enabled on that database.
There are more detaild instructions on how to do this online but here are some basic ones.

* `sudo apt install postgresql-9.5 postgis --fix-missing`
* `sudo su postgres`
* `psql`
* `CREATE USER [your username] WITH PASSWORD '[your password]';`
* `CREATE DATABASE [your database] WITH OWNER [your username];`
* `\c [your database]`
* `CREATE EXTENSION postgis;`
* `\q`

### Full_Noise setup.
Install node v8 and npm.

* `sudo apt install postgresql-server-dev-9.5 node-gyp`
* `git clone https://github.com/TheCacophonyProject/Full_Noise.git`
* `cd Full_Noise`
* `npm install`
* Follow instructions in the TEMPLATE files in the config folder.
* `node_modules/.bin/sequelize db:migrate`
* Start server with `node Server.js`

## License
This project is licensed under the AGPL

