import config from "./config";

const args = require("commander");
const process = require("process");

const { Client } = require("pg");
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

  const client = await pgConnect();

  console.log("deleting duplicate recordings");

  // Duplicate recordings are identified by (DeviceId,
  // recordingDateTime). The recording with the lowest id will be
  // kept. Recordings with an updatedAt timestamp within the last 30
  // mins are ignored.
  //
  // Recordings with a NULL recordingDateTime are also ignored as
  // these are typically recent uploads that are awaiting processing.
  await client.query("BEGIN");
  const res = await client.query(
    `DELETE FROM "Recordings"
     WHERE id IN (
       SELECT id FROM (
         SELECT id,
                ROW_NUMBER() OVER (PARTITION BY "DeviceId", "recordingDateTime" ORDER BY id) as rownum
         FROM "Recordings"
         WHERE "updatedAt" < now() - INTERVAL '30 minutes'
         AND "recordingDateTime" IS NOT NULL
       ) d
       WHERE d.rownum > 1
     ) RETURNING id, "DeviceId", "type", "recordingDateTime"
    `
  );
  for (const row of res.rows) {
    const ts = row.recordingDateTime!.toISOString();
    console.log(
      `deleted ${row.id}: device=${row.DeviceId} type=${row.type} ts=${ts}`
    );
  }
  if (args.delete) {
    await client.query("COMMIT");
    console.log(`deleted ${res.rows.length} duplicate recording(s)`);
  } else {
    await client.query("ROLLBACK");
    console.log(
      `${res.rows.length} duplicate recording(s) would be deleted (pass --delete to remove)`
    );
  }
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

main()
  .catch(console.log)
  .then(() => {
    process.exit(0);
  });
