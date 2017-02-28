#Full_Noise

Full_Noise is a node server that is used for viewing and uploading data for the cacophony project. It consists of a REST API and a basic web interface for viewing your data.

##Setup  
To setup Full_Noise you will need a PostgreSQL database and a S3 file storage (AWS or LeoFS).
### Full_Noise Setup
* Download and install node LTS https://nodejs.org/en/
* Install node-gyp `sudo apt install node-gyp`
* Change to directory where you want the app installed.
* Clone git repository `git clone https://github.com/TheCacophonyProject/Full_Noise.git`
* `cd Full_Noise`
* `npm install`
* `npm install bcrypt` This is installing bcrypt again but seams to fix an error...
* Create your config file `cp config_TEMPLATE.js config.js`
* Enter in appropriate fields in config file.
* Start server `node Server.js`

### LeoFS Setup (S3 file storage)
If you don't want to use LeoFS you can instead setup an AWS S3 bucket and use those credentials.
* Install LeoFS http://leo-project.net/leofs/docs/getting_started/getting_started_1.html
* Create a user saving the private and public keys.
* Create bucket saving the bucket name.
* Enter in the private key, public key, bucket name, and endpoint in the config file.

### PostgreSQL
* Using PostgreSQL 9.5 or above create a user and a database.
* Enter in database name, username, user password, host, and port in the config file. 

## License
This project is licensed under the AGPL

