'use strict';

const fs = require('fs');
const { spawnSync } = require('child_process');

const [envPath, outputPath] = process.argv.slice(2);
if (!envPath || !outputPath) {
  console.error('Usage: node backup-mysql.js <env-file> <output-file>');
  process.exit(2);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const databaseLine = envContent
  .split(/\r?\n/)
  .find((line) => /^\s*(?:export\s+)?DATABASE_URL\s*=/.test(line));
if (!databaseLine) {
  console.error('DATABASE_URL is missing from the environment file');
  process.exit(2);
}

let databaseUrl = databaseLine.replace(/^\s*(?:export\s+)?DATABASE_URL\s*=\s*/, '').trim();
if (
  (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) ||
  (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))
) {
  databaseUrl = databaseUrl.slice(1, -1);
}

const connection = new URL(databaseUrl);
if (connection.protocol !== 'mysql:') {
  console.error('Only MySQL DATABASE_URL values are supported');
  process.exit(2);
}

const output = fs.openSync(outputPath, 'wx', 0o600);
const args = [
  '--single-transaction',
  '--quick',
  '--routines',
  '--triggers',
  '--no-tablespaces',
  '--set-gtid-purged=OFF',
  '--host',
  connection.hostname,
  '--port',
  connection.port || '3306',
  '--user',
  decodeURIComponent(connection.username),
  decodeURIComponent(connection.pathname.slice(1)),
];

const result = spawnSync('/usr/bin/mysqldump', args, {
  env: { ...process.env, MYSQL_PWD: decodeURIComponent(connection.password) },
  stdio: ['ignore', output, 'inherit'],
});
fs.closeSync(output);

if (result.error || result.status !== 0) {
  fs.rmSync(outputPath, { force: true });
  console.error(result.error?.message || `mysqldump exited with status ${result.status}`);
  process.exit(result.status || 1);
}

const size = fs.statSync(outputPath).size;
if (size === 0) {
  fs.rmSync(outputPath, { force: true });
  console.error('mysqldump produced an empty backup');
  process.exit(1);
}

console.log(`Database backup created (${size} bytes)`);
