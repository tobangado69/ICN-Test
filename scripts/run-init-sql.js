/**
 * One-time script: run init SQL against DATABASE_URL (use Railway PUBLIC URL).
 * Usage: DATABASE_URL="postgresql://..." node scripts/run-init-sql.js
 * Get public URL: Railway → Postgres → Variables → DATABASE_PUBLIC_URL or enable TCP Proxy in Networking.
 */
require('dotenv/config');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('Set DATABASE_URL or DATABASE_PUBLIC_URL (Railway public URL)');
  process.exit(1);
}

const sqlPath = path.join(__dirname, 'init-production-db.sql');
let sql = fs.readFileSync(sqlPath, 'utf8');
sql = sql.replace(/^--.*$/gm, '').trim();

const client = new Client({
  connectionString: url,
  ssl: url.includes('railway') || url.includes('rlwy.net') ? { rejectUnauthorized: false } : false,
});

async function main() {
  await client.connect();
  await client.query(sql);
  console.log('Tables created.');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
