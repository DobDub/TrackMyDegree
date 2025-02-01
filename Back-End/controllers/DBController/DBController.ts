import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_SERVER_HOST,
  port: Number(process.env.POSTGRES_SERVER_PORT) || 5432, // Default PostgreSQL port
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, // Optional SSL config
});

/**
 * Get connection obj to database
 * @returns A promise of a Pool Client object, or throws an error
 */
let connectionCount = 0;
async function getConnection() {
  try {
    connectionCount++;
    console.log(`Active connections: ${connectionCount}`);
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
