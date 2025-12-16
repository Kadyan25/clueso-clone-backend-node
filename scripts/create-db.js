// scripts/create-db.js
const mysql = require('mysql2/promise');

async function createDatabase() {
  const DB_NAME = 'clueso_clone_dev';

  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'password', // your local MySQL password
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );

  console.log(`Database ensured: ${DB_NAME}`);
  await connection.end();
}

createDatabase()
  .catch((err) => {
    console.error('Error creating database:', err);
    process.exit(1);
  });
