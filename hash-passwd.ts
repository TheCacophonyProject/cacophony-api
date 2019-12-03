/*
This simple command line tool generates a new password hash for a
given password. It's useful when manually updating a user's password
in the database.
*/

import bcrypt from "bcrypt";

if (process.argv.length != 3) {
  console.log("usage: node hash-passwd.js <password>");
  process.exit(1);
}
const hash = bcrypt.hashSync(process.argv[2], 10);
console.log(hash);
console.log(
  `UPDATE "Users" SET password = '` + hash + `' WHERE username = '<username>'`
);
