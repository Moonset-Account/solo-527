import { pool } from "../app/config/db.server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDB() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSQL = fs.readFileSync(schemaPath, "utf-8");

  try {
    await pool.query("BEGIN");
    await pool.query(schemaSQL);
    await pool.query("COMMIT");
    console.log("Database schema initialized successfully");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Failed to initialize database:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDB();
