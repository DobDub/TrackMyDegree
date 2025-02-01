// src/controllers/adminController.ts
import { Request, Response, NextFunction } from "express";
import Database from "@controllers/DBController/DBController";
import {
  TableListResponse,
  TableRecordsResponse,
  GetTableRecordsRequest,
  StandardResponse,
  TableRecord,
} from "@controllers/adminController/admin_types";

import fs from "fs";
import path from "path";
import { Pool, PoolConfig } from 'pg';
import "dotenv/config";
import { readdir } from 'fs/promises';

/**
 * Fetches the list of all tables in the database.
 */
export const getTables = async (
  req: Request,
  res: Response<StandardResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const pool = await Database.getConnection();
    if (!pool) {
      res
        .status(500)
        .json({ success: false, message: "Database connection failed" });
      return;
    }

    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_catalog = current_database()
    `;

    const result = await pool.query(query);
    const tables: TableListResponse = result.rows.map(
      (row: { table_name: string }) => row.table_name
    );

    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tables",
      data: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
/**
 * Fetches records from a specific table with optional keyword filtering.
 */
export const getTableRecords = async (
  req: GetTableRecordsRequest,
  res: Response<StandardResponse>,
  next: NextFunction
): Promise<void> => {
  const { tableName } = req.params;
  const { keyword } = req.query;

  try {
    const pool = await Database.getConnection();
    if (!pool) {
      res
        .status(500)
        .json({ success: false, message: "Database connection failed" });
      return;
    }

    // Validate table name to prevent SQL injection
    const tableExists = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables 
        WHERE table_name = $1
      )`,
      [tableName.toLowerCase()]
    );

    if (!tableExists.rows[0].exists) {
      res.status(400).json({ success: false, message: "Invalid table name" });
      return;
    }

    let query = `SELECT * FROM "${tableName}"`;
    const values: any[] = [];
    let paramCount = 1;

    if (keyword) {
      // Get text-based columns using parameterized query
      const columnsResult = await pool.query(
        `SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
          AND data_type IN ('text', 'varchar', 'character varying', 'char')`,
        [tableName.toLowerCase()]
      );

      const columns: string[] = columnsResult.rows.map(
        (row: { column_name: string }) => row.column_name
      );

      if (columns.length > 0) {
        const whereClauses = columns.map((col) => {
          values.push(`%${keyword}%`);
          return `"${col}" ILIKE $${paramCount++}`;
        });
        query += ` WHERE ${whereClauses.join(" OR ")}`;
      }
    }

    const result = await pool.query(query, values);
    const records: TableRecordsResponse = result.rows;

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching table records:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching records from table",
      data: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const dbConfig: PoolConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
};
// -------------------------------------
// 2) Data Interfaces
// -------------------------------------
interface Requirement {
  poolId: string; // e.g., "engineering-core"
  poolName: string; // e.g., "Engineering Core (30.5 credits)"
  creditsRequired: number; // e.g., 30.5
  courseCodes: string[]; // e.g., ["ELEC275", "ENCS282", ...]
}

interface DegreeData {
  degreeId: string;
  degreeName: string;
  totalCredits: number;
  requirements: Requirement[];
}

// Requisite Interface
interface Requisite {
  code1: string; // Course code that has the requisite
  code2?: string; // Prerequisite course code (optional for credit-based)
  type: "pre" | "co";
  groupId?: string; // Identifier for groups of alternative requisites
  creditsRequired?: number; // Number of credits required (optional for credit-based)
}

// CourseJson Interface
interface CourseJson {
  title: string; // e.g., "ENGR 201 Professional Practice and Responsibility (1.5 credits)"
  credits?: number; // e.g., 1.5
  description?: string;
  prerequisites?: string; // e.g., "COMP 248, MATH 201" or "COMP 248/MATH 201"
  corequisites?: string; // e.g., "MATH 203" or "MATH 203/ENGR 300"
  // ... more if needed
}

// -------------------------------------
// 3) Parse the Requirements Text File
// -------------------------------------
function parseRequirementsFile(filePath: string): DegreeData {
  const text = fs.readFileSync(filePath, "utf-8");
  const lines = text.split("\n").map((l) => l.trim());

  let degreeId = "";
  let degreeName = "";
  let totalCredits = 120;

  const requirements: Requirement[] = [];
  let currentPoolName = "";
  let currentCredits = 0;
  let currentCourseCodes: string[] = [];

  function pushCurrentPool() {
    if (currentPoolName) {
      // Prefix poolName with degreeId to ensure uniqueness
      const uniquePoolName = `${degreeId} - ${currentPoolName}`;

      requirements.push({
        poolId: uniquePoolName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-credits/g, ""),
        poolName: uniquePoolName,
        creditsRequired: currentCredits,
        courseCodes: currentCourseCodes.filter((cc) => cc),
      });
    }
  }

  for (const line of lines) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (line.includes("DegreeID=")) {
      degreeId = line.split("=")[1].trim();
      continue;
    }
    if (line.includes("DegreeName=")) {
      degreeName = line.split("=")[1].trim();
      continue;
    }
    if (line.includes("TotalCredits=")) {
      totalCredits = parseFloat(line.split("=")[1].trim());
      continue;
    }

    const bracketMatch = line.match(/^\[(.*)\]$/);
    if (bracketMatch) {
      pushCurrentPool();
      currentPoolName = bracketMatch[1];
      currentCourseCodes = [];

      const creditsMatch = currentPoolName.match(/\(([\d\.]+)\s*credits?\)/i);
      currentCredits = creditsMatch ? parseFloat(creditsMatch[1]) : 0;

      continue;
    }

    currentCourseCodes.push(line);
  }

  pushCurrentPool();

  return {
    degreeId,
    degreeName,
    totalCredits,
    requirements,
  };
}

// -------------------------------------
// 4) Parse the JSON (Course Data)
// -------------------------------------
/**
 * Recursively loads all .json files in `dirPath` and merges them into a single Map.
 * Each .json file is assumed to be an array of CourseJson objects.
 */
function loadAllCourseJsons(dirPath: string): Map<string, CourseJson> {
  const courseMap = new Map<string, CourseJson>();

  function recurseDirectory(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectory
        recurseDirectory(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        // Found a JSON file
        try {
          const raw = fs.readFileSync(fullPath, "utf-8");
          const data: CourseJson[] = JSON.parse(raw);

          for (const c of data) {
            // Extract or define a code from c.title (or c.code if you have it)
            const code = extractCodeFromTitle(c.title).toUpperCase();

            if (courseMap.has(code)) {
              // If there's a duplicate code, decide how to handle it
              console.warn(
                `Warning: Duplicate course code "${code}" found in file ${fullPath}. Overwriting previous entry.`
              );
            }

            courseMap.set(code, c);
          }
        } catch (err) {
          console.error(`Error parsing JSON file: ${fullPath}`, err);
        }
      }
    }
  }

  recurseDirectory(dirPath);
  return courseMap;
}

/**
 * Extracts the course code from the course title.
 * Example: "ENGR 201 Professional Practice ... (1.5 credits)" => "ENGR201"
 */
function extractCodeFromTitle(title: string): string {
  const match = title.match(/^([A-Z]{2,4})\s*(\d{3})/);
  if (!match) {
    throw new Error(`Invalid course title format: "${title}"`);
  }
  return `${match[1]}${match[2]}`.toUpperCase(); // e.g., "ENGR201"
}

/**
 * Validates course data for proper formatting.
 * Logs warnings for any inconsistencies found.
 */
function validateCourseData(courseMap: Map<string, CourseJson>): void {
  for (const [code, courseData] of courseMap.entries()) {
    // Validate title format
    if (!/^[A-Z]{2,4}\s*\d{3}/.test(courseData.title)) {
      console.warn(
        `Course "${code}" has an invalid title format: "${courseData.title}"`
      );
    }

    // Validate prerequisites and corequisites
    ["pre", "co"].forEach((field) => {
      const requisiteStr = courseData[field as keyof CourseJson];
      if (requisiteStr && typeof requisiteStr !== "string") {
        console.warn(
          `Course "${code}" has a non-string ${field}:`,
          requisiteStr
        );
      }
    });
  }
}

// -------------------------------------
// 5) Upsert Helpers (SQL Statements)
// -------------------------------------

/**
 * Generates the next ID for a given table based on the prefix.
 * @param t - The SQL transaction.
 * @param tableName - The name of the table.
 * @param prefix - The prefix for the ID.
 * @returns The newly generated ID.
 */
async function generateNextId(
  client: any,
  tableName: string,
  prefix: string
): Promise<string> {
  const query = `
    SELECT MAX(CAST(SUBSTRING(id FROM '${prefix}(\\d+)') AS INTEGER)) AS max_id
    FROM "${tableName}"
    WHERE id LIKE $1
  `;
  const result = await client.query(query, [`${prefix}%`]);
  const maxId = result.rows[0].max_id || 0;
  return `${prefix}${maxId + 1}`;
}

/**
 * Upserts a Degree based on name.
 * Returns the degree's ID.
 */
async function upsertDegree(
  client: any,
  name: string,
  totalCredits: number
): Promise<string> {
  // Check if degree exists by name
  const existsResult = await client.query(
    'SELECT id FROM "Degree" WHERE name = $1',
    [name]
  );

  if (existsResult.rows.length === 0) {
    const newId = await generateNextId(client, "Degree", "D");
    await client.query(
      'INSERT INTO "Degree" (id, name, "totalCredits") VALUES ($1, $2, $3)',
      [newId, name, totalCredits]
    );
    return newId;
  } else {
    const degreeId = existsResult.rows[0].id;
    await client.query(
      'UPDATE "Degree" SET "totalCredits" = $1 WHERE id = $2',
      [totalCredits, degreeId]
    );
    return degreeId;
  }
}

/**
 * Upserts a CoursePool based on name.
 * Returns the course pool's ID.
 */
async function upsertCoursePool(
  client: any,
  poolName: string
): Promise<string> {
  const existsResult = await client.query(
    'SELECT id FROM "CoursePool" WHERE name = $1',
    [poolName]
  );

  if (existsResult.rows.length === 0) {
    const newId = await generateNextId(client, "CoursePool", "CP");
    await client.query(
      'INSERT INTO "CoursePool" (id, name) VALUES ($1, $2)',
      [newId, poolName]
    );
    return newId;
  } else {
    return existsResult.rows[0].id;
  }
}

/**
 * Upserts a Course based on code.
 */
async function upsertCourse(
  client: any,
  code: string,
  credits: number,
  description: string
): Promise<void> {
  const existsResult = await client.query(
    'SELECT code FROM "Course" WHERE code = $1',
    [code]
  );

  if (existsResult.rows.length === 0) {
    await client.query(
      'INSERT INTO "Course" (code, credits, description) VALUES ($1, $2, $3)',
      [code, credits, description]
    );
  } else {
    await client.query(
      'UPDATE "Course" SET credits = $1, description = $2 WHERE code = $3',
      [credits, description, code]
    );
  }
}

/**
 * Upserts a DegreeXCoursePool.
 */
async function upsertDegreeXCoursePool(
  client: any,
  degreeId: string,
  poolId: string,
  creditsRequired: number
): Promise<string> {
  const existsResult = await client.query(
    'SELECT id FROM "DegreeXCoursePool" WHERE degree = $1 AND coursepool = $2',
    [degreeId, poolId]
  );

  if (existsResult.rows.length === 0) {
    const newId = await generateNextId(client, "DegreeXCoursePool", "DXCP");
    await client.query(
      'INSERT INTO "DegreeXCoursePool" (id, degree, coursepool, "creditsRequired") VALUES ($1, $2, $3, $4)',
      [newId, degreeId, poolId, creditsRequired]
    );
    return newId;
  } else {
    await client.query(
      'UPDATE "DegreeXCoursePool" SET "creditsRequired" = $1 WHERE id = $2',
      [creditsRequired, existsResult.rows[0].id]
    );
    return existsResult.rows[0].id;
  }
}

/**
 * Upserts a CourseXCoursePool with an optional groupId.
 */
async function upsertCourseXCoursePool(
  client: any,
  courseCode: string,
  poolId: string,
  groupId: string | null
): Promise<string> {
  const existsResult = await client.query(
    `SELECT id FROM "CourseXCoursePool" 
    WHERE coursecode = $1 AND coursepool = $2 
    AND (groupId IS NOT DISTINCT FROM $3)`,
    [courseCode, poolId, groupId]
  );

  if (existsResult.rows.length === 0) {
    const newId = await generateNextId(client, "CourseXCoursePool", "CXP");
    await client.query(
      'INSERT INTO "CourseXCoursePool" (id, coursecode, coursepool, groupId) VALUES ($1, $2, $3, $4)',
      [newId, courseCode, poolId, groupId]
    );
    return newId;
  } else {
    return existsResult.rows[0].id;
  }
}

/**
 * Upserts a Requisite (prerequisite or corequisite).
 */
async function upsertRequisite(
  client: any,
  requisite: Requisite
): Promise<void> {
  const { code1, code2, type, groupId, creditsRequired } = requisite;

  const query = `
    INSERT INTO "Requisite" 
      (id, code1, code2, type, group_id, "creditsRequired")
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (code1, COALESCE(code2, ''), type, COALESCE(group_id, ''), "creditsRequired") 
    DO NOTHING
  `;

  const newId = await generateNextId(client, "Requisite", "R");
  await client.query(query, [
    newId,
    code1,
    code2 || null,
    type,
    groupId || null,
    creditsRequired || null
  ]);
}


/**
 * Retrieves the pool ID by pool name.
 */
async function getPoolIdByName(
  client: any,  // PostgreSQL client/transaction
  poolName: string
): Promise<string> {
  const result = await client.query(
    'SELECT id FROM "CoursePool" WHERE name = $1',
    [poolName]
  );

  if (result.rows.length === 0) {
    throw new Error(`CoursePool with name "${poolName}" does not exist.`);
  }

  return result.rows[0].id;
}

/**
 * Generates a unique groupId based on degreeId, poolId, and groupNumber.
 */
function generateGroupId(degreeId: string, poolId: string, groupNumber: number): string {
  return `${degreeId}-${poolId}-G${groupNumber}`;
}

// -------------------------------------
// 5) Parse Requisites Function
// -------------------------------------

let globalGroupCounter = 1; // To generate unique group IDs

/**
 * Parses a prerequisites/corequisites string into an array of Requisite objects.
 * Handles various separators (commas and slashes) and groups alternatives separated by slashes.
 * Example: "COMP 248/MATH 201; SOEN 287" => [
 *   { code1: 'TARGET_CODE', code2: 'COMP248', type: 'prerequisite', groupId: 'D1-CP1-G1' },
 *   { code1: 'TARGET_CODE', code2: 'MATH201', type: 'prerequisite', groupId: 'D1-CP1-G1' },
 *   { code1: 'TARGET_CODE', code2: 'SOEN287', type: 'prerequisite' }
 * ]
 */
function parseRequisites(
  code1: string,
  requisiteStr: string | undefined,
  type: "pre" | "co"
): Requisite[] {
  if (!requisiteStr) return [];

  if (typeof requisiteStr !== "string") {
    console.warn(
      `Expected string for requisites but got ${typeof requisiteStr} for course ${code1}. Skipping.`
    );
    return [];
  }

  // Replace semicolons with commas for uniformity
  const cleanedStr = requisiteStr.replace(/;/g, ",");

  // Split by comma to handle individual prerequisites
  const parts = cleanedStr.split(",");

  const requisites: Requisite[] = [];

  for (const part of parts) {
    const trimmedPart = part.trim().replace(/\./g, ""); // Remove periods

    if (trimmedPart.includes("/")) {
      // This part contains alternative requisites
      const alternatives = trimmedPart.split("/").map((c) => c.trim());

      const groupId = `G${globalGroupCounter++}`; // Assign a unique group ID

      for (const alt of alternatives) {
        const code = alt.replace(/\s+/g, "").toUpperCase();

        if (/^[A-Z]{2,4}\d{3}$/.test(code)) {
          requisites.push({
            code1,
            code2: code,
            type,
            groupId,
          });
        } else if (/^\d+CR$/.test(code)) {
          // Detect credit requirements like "75CR"
          requisites.push({
            code1,
            creditsRequired: parseInt(code.replace("CR", "")),
            type,
            groupId,
          });
        } else {
          console.warn(
            `Invalid course code or credit requirement "${code}" in requisites for course "${code1}". Skipping.`
          );
        }
      }
    } else {
      // Single requisite
      const code = trimmedPart.replace(/\s+/g, "").toUpperCase();

      if (/^[A-Z]{2,4}\d{3}$/.test(code)) {
        requisites.push({
          code1,
          code2: code,
          type,
        });
      } else if (/^\d+CR$/.test(code)) {
        // Detect credit requirements like "75CR"
        requisites.push({
          code1,
          creditsRequired: parseInt(code.replace("CR", "")),
          type,
        });
      } else {
        console.warn(
          `Invalid course code or credit requirement "${code}" in requisites for course "${code1}". Skipping.`
        );
      }
    }
  }

  return requisites;
}

// -------------------------------------
// 6) Main Seed Function
// -------------------------------------
/**
 * Main Seed Function to populate the database.
 */
async function seedSoenDegree() {
  const pool = new Pool(dbConfig);
  let client: any = null;

  try {
    client = await pool.connect();

    const requirementsDir = path.join(__dirname, "../../course-data/degree-reqs");
    const courseListsDir = path.join(__dirname, "../../course-data/course-lists");
    const files = await readdir(requirementsDir);
    const requirementFiles = files.filter(file => file.endsWith(".txt"));
    const courseMap = loadAllCourseJsons(courseListsDir);

    validateCourseData(courseMap);

    // Verify database connection
    const dbResult = await client.query('SELECT current_database()');
    console.log(`Connected to database: ${dbResult.rows[0].current_database}`);

    for (const file of requirementFiles) {
      await client.query('BEGIN');

      try {
        const filePath = path.join(requirementsDir, file);
        const { degreeName, totalCredits, requirements } = parseRequirementsFile(filePath);

        const degreeId = await upsertDegree(client, degreeName, totalCredits);

        for (const req of requirements) {
          const poolId = await upsertCoursePool(client, req.poolName);
          await upsertDegreeXCoursePool(client, degreeId, poolId, req.creditsRequired);

          for (const courseCode of req.courseCodes) {
            const upperCode = courseCode.toUpperCase().replace(/\s+/g, "");
            if (!/^[A-Z]{2,4}\d{3}$/.test(upperCode)) continue;

            await upsertCourseXCoursePool(
              client,
              upperCode,
              poolId,
              null
            );
          }
        }

        for (const [code, courseData] of courseMap.entries()) {
          await upsertCourse(
            client,
            code,
            courseData.credits || 3,
            courseData.description || `No description for ${code}`
          );
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// If running from command line: `ts-node adminController.ts`
if (require.main === module) {
  seedSoenDegree();
}

export { seedSoenDegree };
