-- sudo -i -u postgres psql {dbname} -f /test/db-seed.sql
INSERT INTO "Users" (username, email, password, "globalPermission", "createdAt", "updatedAt") VALUES ('admin_test', 'admin@email.com', '$2a$10$1//aJH6/g9duTPxFyqByZ.yHD0XYv2.d3748CkXR/1/V0mXLFTwM.', 'write', now(), now());
