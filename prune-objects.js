const process = require("process");
const args = require('commander');
const { Client } = require('pg');
const config = require('./config');
const modelsUtil = require('./models/util/util');


async function main() {
  args
    .option('--config <path>', 'Configuration file', './config/app.js')
    .option('--delete', 'Actually delete objects (dry run by default)')
    .parse(process.argv);

  config.loadConfig(args.config);

  const pgClient = await pgConnect();
  const s3 = modelsUtil.openS3();

  console.log("retrieving all keys from object store");
  const storeKeys = await allBucketKeys(s3, config.s3.bucket);
  console.log(`${storeKeys.size} keys in object store`);

  console.log("retrieving all keys referenced in database");
  const dbKeys = await allDBKeys(pgClient);
  console.log(`${dbKeys.size} keys in database`);

  const toDelete = new Set([...storeKeys].filter(x => !dbKeys.has(x)));
  console.log(`${toDelete.size} keys to delete`);
  if (toDelete.size < 1) {
    return;
  }

  if (args.delete) {
    await deleteObjects(s3, config.s3.bucket, toDelete);
    console.log("objects deleted");
  } else {
    console.log("(no objects deleted without --delete)");
  }
}

async function allBucketKeys(s3, bucket) {
  const params = {
    Bucket: bucket,
  };

  var keys = new Set();
  for (;;) {
    var data = await s3.listObjects(params).promise();

    data.Contents.forEach((elem) => {
      keys.add(elem.Key);
    });

    if (!data.IsTruncated) {
      break;
    }
    params.Marker = data.NextMarker;
  }

  return keys;
}

async function deleteObjects(s3, bucket, keys) {
  const params = {
    Bucket: bucket,
  };

  for (const key of keys) {
    params.Key = key;
    await s3.deleteObject(params).promise();
  }
}

async function pgConnect() {
  const dbconf = config.database;
  const client = new Client({
    host: dbconf.host,
    port: dbconf.port,
    user: dbconf.username,
    password: dbconf.password,
    database: dbconf.database,
  });
  await client.connect();
  return client;
}

async function allDBKeys(client) {
  var keys = new Set();
  const res = await client.query(`
        select "fileKey" as fk, NULL as rk from "AudioRecordings"
        union
        select "fileKey" as fk, "rawFileKey" as rk from "Recordings"
        union
        select "fileKey" as fk, NULL as rk from "Files"
  `);
  for (const row of res.rows) {
    if (row.fk) {
      keys.add(row.fk);
    }
    if (row.rk) {
      keys.add(row.rk);
    }
  }
  return keys;
}


main()
  .catch ((err) => { console.log(err); })
  .then(() => { process.exit(0); });
