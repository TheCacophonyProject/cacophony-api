#/bin/bash

image_name=cacophony-api
container_name="cacophony-api-test"

echo "Stopping $container_name container (if running)"
sudo docker rm --force $container_name &> /dev/null

sudo docker build . -t $image_name

# Publish PostgreSQL on a different port externally (5400) to avoid
# collisions with an PostgreSQL instance on the host.
sudo docker run -td --rm \
     --name $container_name \
     -p 1080:1080 \
     -p 9001:9001 \
     -p 5400:5432 \
     $image_name

sudo docker cp . $container_name:/
sudo docker exec $container_name bash -c "$@ rm -r /node_modules"
sudo docker exec $container_name bash -c "$@ echo 'npm install...'        && npm install"
sudo docker exec $container_name bash -c "$@ echo 'migrating database...' && node_modules/sequelize-cli/bin/sequelize db:migrate --config config/app_test_default.js"
sudo docker exec $container_name bash -c "sudo -i -u postgres psql cacophonytest -f /test/db-seed.sql"
sudo docker exec $container_name bash -c "$@ node /Server.js --config=config/app_test_default.js${BG:+ &> /dev/null &}"
