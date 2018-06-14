-- sudo -i -u postgres psql {dbname} -f /test/db-seed.sql
INSERT INTO "Users" (username, password, superuser, "createdAt", "updatedAt") VALUES ('admin_test', '$2a$10$1//aJH6/g9duTPxFyqByZ.yHD0XYv2.d3748CkXR/1/V0mXLFTwM.', true, now(), now());
