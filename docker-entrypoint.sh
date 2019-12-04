#!/bin/bash
set -e

cd /app

echo "---- Generating API doc ----"
npm run apidoc

echo "---- Migrating database ----"
node_modules/.bin/sequelize db:migrate --config config/app_test_default.js
node_modules/.bin/sequelize db:seed:all --config config/app_test_default.js

$NODE_BIN Server.js --config=config/app_test_default.js
