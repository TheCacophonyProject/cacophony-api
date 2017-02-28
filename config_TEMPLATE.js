//Config file: enter in the relevant data then save as 'config.js'
//The 'config.js' file is in the .gitignore file.
var config = {};

config.db = {}; //Holds config data fot the database
config.s3 = {}; //Holds config data for the AWS S3
config.logger = {};
config.server = {};
config.passport = {};

config.db.name = 'cacophony_metadata';
config.db.username = 'username';
config.db.password = 'password';
config.db.host = '192.168.33.10';
config.db.port = '5432';
config.db.dialect = 'postgres';
config.db.logging = false;  //Logging for the ORM

config.s3.publicKey = publicKey;
config.s3.privateKey = privateKey;
config.s3.bucket = 'bucket name';
config.s3.region = 'us-west-2';
config.s3.endpoint = endpoint_to_bucket;

config.logger.level = 'debug';

config.server.port = 8888;

config.passport.secret = secret;

module.exports = config;
