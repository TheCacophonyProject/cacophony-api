// A real test configuration
// @todo: consider reading from env vars

const server = {
  passportSecret: "something",
  loggerLevel: "debug",
  http: {
    active: true,
    port: 1080
  },
  recording_url_base: "http://test.site/recording"
};

const s3 = {
  publicKey: "minio",
  privateKey: "miniostorage",
  bucket: "cacophony",
  endpoint: "http://127.0.0.1:9001"
};

const fileProcessing = {
  port: 2008
};

// ======= Database settings =======
const database = {
  username: "test",
  password: "test",
  database: "cacophonytest",
  host: "localhost",
  dialect: "postgres"
};

exports.server = server;
exports.s3 = s3;
exports.fileProcessing = fileProcessing;
exports.database = database;

// This is needed because Sequelize looks for development by default
// when using db:migrate
exports.development = database;
