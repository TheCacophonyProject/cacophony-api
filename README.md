# Full_Noise

Full_Noise is a Node server that is used for uploading, processing and
retrieval of media collected for the Cacophony Project. It consists of
a REST API and a basic web interface for viewing your data.

## Setup

To run Full_Noise you will need create a PostgreSQL database and a
LeoFS bucket first.

### LeoFS Setup

* Download LeoFS from https://leo-project.net/leofs/download.html
* Follow the installation instructions at https://leo-project.net/leofs/docs/installation/quick/
* Create a user saving the id and secret: `leofs-adm create-user [username]`
* Record the access key and secret acccess key generated.
* Create a bucket for Full Noise to use: `leofs-adm add-bucket [bucket name] [access key]`
* Ensure that /etc/hosts has a `[bucket name].localhost` entry as described in the LeoFS documentation.

### PostgreSQL Setup

A user account needs to be created within PostgreSQL as the owner of a
database. The PostGIS extension also needs to be enabled on that
database.

* Choose a PostgreSQL database name, username & password
* `sudo apt install postgresql-9.5 postgis --fix-missing`
* `sudo -i -u postgres`
* `psql`
* `CREATE USER [username] WITH PASSWORD '[password]';`
* `CREATE DATABASE [database] WITH OWNER [username];`
* `\c [database]`
* `CREATE EXTENSION postgis;`
* `\q`

### Full_Noise setup.

* Install Node version 8 or later from http://nodejs.org/
* `sudo apt install postgresql-server-dev-9.5`
* `git clone https://github.com/TheCacophonyProject/Full_Noise.git`
* `cd Full_Noise`
* `npm install`
* Follow instructions in the TEMPLATE files in the config folder.
* `node_modules/.bin/sequelize db:migrate`
* Start server with `node Server.js`

## License

This project is licensed under the Affero General Public License
(https://www.gnu.org/licenses/agpl-3.0.en.html).

