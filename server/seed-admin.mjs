import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadConfig } from "./config.mjs";
import { createDbPool } from "./db.mjs";
import { hashPassword } from "./password.mjs";

const config = loadConfig();
const pool = createDbPool(config.authDb);
const rl = createInterface({ input, output });

try {
  const fullName = (await rl.question("Full name: ")).trim();
  const username = (await rl.question("Username: ")).trim();
  const email = (await rl.question("Email: ")).trim().toLowerCase();
  const password = await rl.question("Password (min 8 chars): ");

  if (fullName.length < 2 || username.length < 3 || !email.includes("@") || password.length < 8) {
    throw new Error("Invalid admin details supplied.");
  }

  const [existingRows] = await pool.query(
    "SELECT id FROM portal_users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1",
    [username.toLowerCase(), email],
  );

  if (existingRows[0]) {
    throw new Error("An account with that username or email already exists.");
  }

  const passwordHash = await hashPassword(password);
  await pool.query(
    `
      INSERT INTO portal_users (full_name, username, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'admin', 'active')
    `,
    [fullName, username, email, passwordHash],
  );

  console.log("Admin user created successfully.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
