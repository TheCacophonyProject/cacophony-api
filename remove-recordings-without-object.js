/*
 * This is a one-off script to remove objects that were missing a
 * rawFileKey or referred to a rawFileKey which wasn't in the object
 * store.
 */

const process = require("process");
const args = require("commander");
const { Client } = require("pg");
const moment = require("moment");
const uuidv4 = require("uuid/v4");
const winston = require("winston");

const config = require("./config");
const modelsUtil = require("./models/util/util");

async function main() {
  args
    .option("--config <path>", "Configuration file", "./config/app.js")
    .option("--delete", "Actually delete objects (dry run by default)")
    .parse(process.argv);

  config.loadConfig(args.config);

  const pgClient = await pgConnect();
  const s3 = modelsUtil.openS3();

  const rows = await loadRecordingKeys(pgClient);
  for (const [id, type, dt, key] of rows) {
    if (!key || !(await objectExists(s3, config.s3.bucket, key))) {
      if (args.delete) {
        logger.info("deleting", { id, type, dt });
        await deleteRecording(pgClient, id);
      } else {
        logger.info("would delete", { id, type, dt });
      }
    }
  }
}

async function pgConnect() {
  const dbconf = config.database;
  const client = new Client({
    host: dbconf.host,
    port: dbconf.port,
    user: dbconf.username,
    password: dbconf.password,
    database: dbconf.database
  });
  await client.connect();
  return client;
}

async function loadRecordingKeys(client) {
  const res = await client.query({
    text: `select id, "type", "recordingDateTime", "rawFileKey" from "Recordings" where "processingState" = 'FINISHED'`,
    rowMode: "array"
  });
  return res.rows;
}

async function deleteRecording(client, id) {
  await client.query({
    text: `delete from "Recordings" where id = $1`,
    values: [id]
  });
}

async function objectExists(s3, bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key,
    Range: "bytes=0-1"
  };
  try {
    await s3.getObject(params).promise();
  } catch (err) {
    if (err.code == "NoSuchKey") return false;
    throw err;
  }
  return true;
}

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: function() {
        return moment().format();
      },
      colorize: true
    })
  ]
});

main()
  .catch(logger.error)
  .then(() => {
    process.exit(0);
  });
