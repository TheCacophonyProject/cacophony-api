// Config instructions: Fill out required fields and save as 'config.js'

// ======= SERVER ==========
server = { // General server settings
  passportSecret: null, // REQUIRED, String. Random string used for passport module for encrypting JWT.
  loggerLevel: "debug", // REQUIRED, one of ('debug', 'warning', 'info', 'error')
  http: {
    active: true,
    port: 80,
  },
};

// ======= S3 compatible object store settings, e.g. Minio ===========
s3 = {  // Used for storing audio & video recordings.
  publicKey: "",  // REQUIRED, String:
  privateKey: "", // REQUIRED, String
  bucket: "cacophony",   // REQUIRED, String
  endpoint: "http://localhost:9000", // REQUIRED, URL
};


// ======= Logging =======
logging = {
  folder: "logFiles", // REQUIRED Folder of the logging file.
}

// ======= File Processing =======
fileProcessing = {
  port: 2002,
};

// ======= Database settings =======
database = {
  username: "root",
  password: "",
  database: "cacophony",
  host: "localhost",
  dialect: "postgres"
};

exports.server = server;
exports.s3 = s3;
exports.logging = logging;
exports.fileProcessing = fileProcessing;
exports.database = database;

// This is needed because Sequelize looks for development by default when using db:migrate
exports.development = database;