/*
This is a one-off script to migrate old recordings animal tags to track tags. 
Only where there is 1 old manual tag and 1 new Track with no manual tags.
*/

import process from "process";

import config from "./config";

const args = require("commander");
const { Client } = require("pg");
const winston = require("winston");
const moment = require("moment");

const MIN_CONFIDENCE = 0.6;
const animals = Object.freeze([
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
]);
let Config;
async function main() {
  args
    .option("--config <path>", "Configuration file", "./config/app.js")
    .option("--algorithm <algid>", "Minimum algorithm requirement", 41)
    .option("-c, --create", "Create new track tags from old tags")
    .option("-d, --delete", "Delete manual old tags")
    .option(
      "-b, --before <date>",
      "Delete manual old tags that were created/updated before this date YYYY-MM-dd",
      "2019-08-01"
    )
    .parse(process.argv);

  Config = {
    ...config,
    ...config.loadConfig(args.config)
  };
  const pgClient = await pgConnect();
  if (args.create) {
    await createNewTrackTags(pgClient);
  }
  if (args.delete) {
    await deleteOldTags(pgClient);
  }
}

async function createNewTrackTags(pgClient) {
  const recordings = await getSingleTrackRecordings(pgClient);
  logger.info(`Create found ${recordings.length} possible recordings`);
  for (const [rId, trackId, oldTags] of recordings) {
    const manualAnimals = getManualAnimalTags(oldTags);
    if (manualAnimals.length == 1) {
      await addTrackTag(pgClient, rId, trackId, manualAnimals[0]);
    }
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

async function addTrackTag(client, rId, trackId, tag) {
  logger.info(
    `Adding Tag to ${trackId} for recording:${rId} animal:${tag.what}`
  );
  const text = `INSERT INTO "TrackTags" 
  (what, confidence, data, automatic, "createdAt", "updatedAt", "TrackId", "UserId") 
  VALUES($1, $2, $3, $4, $5, $6, $7, $8);`;
  const values = [
    tag.what,
    tag.confidence,
    '""',
    tag.automatic,
    tag.createdAt,
    "`now()`",
    trackId,
    tag.taggerId
  ];
  await client.query(text, values).catch((e) => {
    logger.error(e.stack);
    process.exit(0);
  });
}

function getManualAnimalTags(oldTags) {
  return oldTags.filter((tag) => {
    return (
      !tag.automatic &&
      animals.includes(tag.what) &&
      tag.confidence >= MIN_CONFIDENCE
    );
  });
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
                  SELECT 1 FROM "TrackTags" tag WHERE tag."TrackId" = t."id" AND not tag."automatic"
      )  
      AND r."additionalMetadata" IS NOT NULL
      AND r."additionalMetadata" ? 'oldTags'
      AND (r."additionalMetadata"->>'algorithm')::int >=$1`,
    values: [args.algorithm],
    rowMode: "array"
  });
  return res.rows;
}

function toTimestamp(strDate) {
  const datum = Date.parse(strDate);
  return datum / 1000;
}

function getAnimalsSql() {
  return animals.map((animal) => `'${animal}'`).join(",");
}

async function deleteOldTags(pgClient) {
  const recordings = await getOldTags(pgClient);
  logger.info(`Delete found ${recordings.length} possible old tags`);
  for (const [tagId, oldTags] of recordings) {
    if (oldTags.find((oldTag) => oldTag.id === tagId)) {
      await deleteTag(pgClient, tagId);
    }
  }
}

async function deleteTag(client, tagId) {
  logger.info("Deleting tag", tagId);
  await client.query(`DELETE FROM "Tags" where "id"=$1`, [tagId]).catch((e) => {
    logger.error(e.stack);
    process.exit(0);
  });
}

async function getOldTags(client) {
  const res = await client
    .query({
      text: `SELECT t."id", r."additionalMetadata"->'oldTags' as trackId FROM "Tags" t
    JOIN "Recordings" r on r."id" = t."RecordingId"
    WHERE r."additionalMetadata" IS NOT NULL
    AND t."createdAt" < to_timestamp($1) AND t."updatedAt" < to_timestamp($1)
    AND NOT t."automatic"
    AND t."what" in (${getAnimalsSql()})
    AND r."additionalMetadata" ? 'oldTags'
    AND (r."additionalMetadata"->>'algorithm')::int >=$2`,
      values: [toTimestamp(args.before), args.algorithm],
      rowMode: "array"
    })
    .catch((e) => {
      logger.error(e.stack);
      process.exit(0);
    });
  return res.rows;
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
