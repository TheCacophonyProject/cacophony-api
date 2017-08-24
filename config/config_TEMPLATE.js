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

// ======= LeoFS ===========
leoFS = { // Object storage used for saving recording files.
  publicKey: null,  // REQUIRED, String:
  privateKey: null, // REQUIRED, String
  bucket: null,   // REQUIRED, String
  endpoint: "localhost", // REQUIRED, URL
};

exports.server = server;
exports.leoFS = leoFS;
