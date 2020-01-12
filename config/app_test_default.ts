// A real test configuration
// @todo: consider reading from env vars

export const server = {
  passportSecret: "something",
  loggerLevel: "debug",
  http: {
    active: true,
    port: 1080
  },
  recording_url_base: "http://test.site/recording"
};

export const s3 = {
  publicKey: "minio",
  privateKey: "miniostorage",
  bucket: "cacophony",
  endpoint: "http://127.0.0.1:9001"
};

export const fileProcessing = {
  port: 2008
};

// ======= Database settings =======
export const database = {
  username: "test",
  password: "test",
  database: "cacophonytest",
  host: "localhost",
  dialect: "postgres"
};

// This is needed because Sequelize looks for development by default
// when using db:migrate
export const development = database;

export default {
  server,
  s3,
  fileProcessing,
  database,
}
