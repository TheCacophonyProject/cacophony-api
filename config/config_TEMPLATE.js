// Config instructions: Fill out required fields and save as 'config.js'

// ======= SERVER ==========
server = { // General server settings
  passportSecret: null, // REQUIRED, String. Random string used for passport module for encrypting JWT.
  loggerLevel: "debug", // REQUIRED, one of ('debug', 'warning', 'info', 'error')
  http: {
    active: true,
    port: 80,
  },
  https: { // If using https put private and public keys in the keys folder.
    active: false,
    port: 443,
  },
};

// ======= S3 compatible object store settings, e.g. Minio ===========
s3 = {  // Used for storing audio & video recordings.
  publicKey: null,  // REQUIRED, String (aka Minio AccessKey)
  privateKey: null, // REQUIRED, String (aka Minio SecretKey)
  bucket: "cacophony",   // REQUIRED, String
  endpoint: "http://localhost:9000", // REQUIRED, URL
};

// ======= Logging =======
logging = {
  folder: null, // REQUIRED Folder of the logging file.
}

// ======= File Processing =======
fileProcessing = {
  port: 2002,
};

exports.server = server;
exports.s3 = s3;
exports.logging = logging;
exports.fileProcessing = fileProcessing;
