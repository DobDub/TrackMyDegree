import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const pool = new Pool({
  user: process.env.SQL_SERVER_USER,
  password: process.env.SQL_SERVER_PASSWORD,
  database: process.env.SQL_SERVER_DATABASE,
  host: process.env.SQL_SERVER_HOST,
  port: Number(process.env.SQL_SERVER_PORT) || 5432, // Default PostgreSQL port
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, // Optional SSL config
});

/**
 * Get connection obj to database
 * @returns A promise of a Pool Client object, or throws an error
 */
async function getConnection() {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL successfully!");
    return client;
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

const DBController = {
  getConnection
};

export default DBController;
