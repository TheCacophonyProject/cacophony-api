#!/bin/bash
set -e

echo "---- Starting api doc ----"

cd /app


echo "---- Generating API doc ----"
npm run apidoc

echo "---- Compiling TypeScript ----"
node_modules/.bin/tsc

echo "---- Migrating database ----"
node_modules/.bin/sequelize db:migrate --config config/app_test_default.js
node_modules/.bin/sequelize db:seed:all --config config/app_test_default.js

$NODE_BIN Server.js --config=config/app_test_default.js
./node_modules/.bin/tsc-watch --onSuccess "node Server.js --config=config/app_test_default.js"
