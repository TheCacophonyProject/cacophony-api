/*
This is a one-off script to add type prefixes to object keys that don't have one.
*/

const process = require("process");
const args = require("commander");
const { Client } = require("pg");
const winston = require("winston");
const config = require("./config");
const moment = require("moment");

const MIN_CONFIDENCE = 0.6;
const animals = [
  "possum",
  "rodent",
  "mustelid",
  "hedgehog",
  "cat",
  "bird",
  "kiwi",
  "dog",
  "leporidae",
  "human",
  "insect",
  "pest",
  "part"
];
Object.freeze(animals);

async function main() {
  args
    .option("--config <path>", "Configuration file", "./config/app.js")
    .parse(process.argv);

  config.loadConfig(args.config);

  const pgClient = await pgConnect();
  const recordings = await getSingleTrackRecordings(pgClient);
  let manualAnimals;
  logger.info(`Found ${recordings.length} possible recordings`);
  for (const [rId, trackId, oldTags] of recordings) {
    manualAnimals = getManualAnimalTags(oldTags);
    if (manualAnimals.length == 1) {
      await addTrackTag(pgClient, rId, trackId, manualAnimals[0]);
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

async function addTrackTag(client, rId, trackId, tag) {
  logger.info(
    `Adding Tag to ${trackId} for recording:${rId} animal:${tag.what}`
  );
  const text = `INSERT INTO "TrackTags" 
  (what, confidence, data, automatic, "createdAt", "updatedAt", "TrackId", "UserId") 
  VALUES($1, $2, $3, $4, $5, $6, $7, $8);`;
  const values = [
    `${tag.what}`,
    tag.confidence,
    '""',
    tag.automatic,
    tag.createdAt,
    "`now()`",
    trackId,
    tag.taggerId
  ];
  await client.query(text, values).catch(e => logger.error(e.stack));
}

function getManualAnimalTags(oldTags) {
  const manualAnimalTags = [];
  let tag;
  for (let i = 0; i < oldTags.length; i++) {
    tag = oldTags[i];
    if (
      tag.automatic == false &&
      animals.includes(tag.what) &&
      tag.condidence > MIN_CONFIDENCE
    ) {
      manualAnimalTags.push(tag);
    }
  }
  return manualAnimalTags;
}

async function getSingleTrackRecordings(client) {
  const res = await client.query({
    text: `SELECT r."id",t."id", r."additionalMetadata"->'oldTags'
      FROM "Recordings" r
      JOIN "Tracks" t on t."RecordingId" = r."id"
      JOIN (
        SELECT rSub."id", COUNT(t.*) as trackCount  
        FROM "Recordings"  rSub 
        JOIN "Tracks" t on t."RecordingId" = rSub."id" 
        GROUP BY rSub."id" 
        ) temp on temp.id = r.id
      WHERE temp.trackCount = 1 AND
      NOT EXISTS (
                  SELECT 1 FROM "TrackTags" tag WHERE tag."TrackId" = t."id" AND tag."automatic"=false
      )  
      AND r."additionalMetadata" IS NOT NULL
      AND r."additionalMetadata" ? 'oldTags'
      AND (r."additionalMetadata"->>'algorithm')::int >=41`,
    rowMode: "array"
  });
  return res.rows;
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
