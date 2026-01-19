import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
const { Pool } = pkg;

const databaseUrl = process.env.DATABASE_URL || "postgres://root:admin@localhost:5432/postgres";
export const pool = new Pool({
  connectionString: databaseUrl,
});
