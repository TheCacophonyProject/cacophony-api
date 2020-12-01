// A real test configuration
// @todo: consider reading from env vars
exports.server = {
  passportSecret: "something",
  loggerLevel: "debug",
  http: {
    active: true,
    port: 1080
  },
  recording_url_base: "http://test.site/recording"
};
exports.s3 = {
  publicKey: "minio",
  privateKey: "miniostorage",
  bucket: "cacophony",
  endpoint: "http://127.0.0.1:9001"
};
exports.fileProcessing = {
  port: 2008
};
// ======= Database settings =======
exports.database = {
  username: "test",
  password: "test",
  database: "cacophonytest",
  host: "localhost",
  dialect: "postgres"
};

exports.smtpDetails = {
  service: "gmail",
  from_name: "Alert User",
  auth: {
    user: "giampaolo@cacophony.org.nz",
    pass: "bl00dybrilliant"
  }
};
// This is needed because Sequelize looks for development by default
// when using db:migrate
exports.development = exports.database;
exports.default = {
  smtpDetails: exports.smtpDetails,
  server: exports.server,
  s3: exports.s3,
  fileProcessing: exports.fileProcessing,
  database: exports.database
};
