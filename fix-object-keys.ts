/*
This is a one-off script to add type prefixes to object keys that don't have one.
*/

import config from "./config";

const process = require("process");
const args = require("commander");
const { Client } = require("pg");
const moment = require("moment");
const uuidv4 = require("uuid/v4");
const winston = require("winston");
const modelsUtil = require("./models/util/util");

// Define the types of object keys that will be considered for pruning.
const keyTypes = Object.freeze([
  { prefix: "f", table: "Files", column: "fileKey" },
  { prefix: "raw", table: "Recordings", column: "rawFileKey" },
  { prefix: "rec", table: "Recordings", column: "fileKey" }
]);

let Config;

async function main() {
  args
    .option("--config <path>", "Configuration file", "./config/app.js")
    .option("--delete", "Actually delete objects (dry run by default)")
    .parse(process.argv);

  Config = {
    ...config,
    ...config.loadConfig(args.config)
  };

  const pgClient = await pgConnect();
  const s3 = modelsUtil.openS3();

  for (const kt of keyTypes) {
    const rows = await loadDBKeys(pgClient, kt.table, kt.column);
    const desiredPrefix = kt.prefix + "/";
    for (const [id, key, dt] of rows) {
      if (!key.startsWith(desiredPrefix)) {
        const newKey = makeKey(kt.prefix, dt);
        logger.info(`${kt.table}[${id}]: ${kt.column} "${key}" => "${newKey}"`);
        try {
          await copyObject(s3, Config.s3.bucket, key, newKey);
          await updateDBKey(pgClient, kt.table, id, kt.column, newKey);
          await deleteObject(s3, Config.s3.bucket, key);
        } catch (e) {
          logger.error(e.message);
        }
      }
    }
  }
}

function makeKey(prefix, dt) {
  return prefix + moment(dt).format("/YYYY/MM/DD/") + uuidv4();
}

async function pgConnect() {
  const dbconf = Config.database;
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

async function loadDBKeys(client, table, column) {
  const res = await client.query({
    text: `select id, "${column}", "createdAt" from "${table}" where "${column}" is not NULL`,
    rowMode: "array"
  });
  return res.rows;
}

async function updateDBKey(client, table, id, column, newKey) {
  await client.query({
    text: `update "${table}" set "${column}"=$2 where id = $1`,
    values: [id, newKey]
  });
}

async function copyObject(s3, bucket, srcKey, dstKey) {
  const params = {
    CopySource: bucket + "/" + srcKey,
    Bucket: bucket,
    Key: dstKey
  };
  await s3.copyObject(params).promise();
}

async function deleteObject(s3, bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key
  };
  await s3.deleteObject(params).promise();
}

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: function () {
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
