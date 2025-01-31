import Database from "@controllers/DBController/DBController";
import DeficiencyTypes from "@controllers/deficiencyController/deficiency_types";
import { randomUUID } from "crypto";

async function createDeficiency(
  coursepool: string,
  user_id: string,
  creditsRequired: number
): Promise<DeficiencyTypes.Deficiency | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a deficiency with the same attributes already exists
      const existingDeficiency = await conn.query(
        'SELECT * FROM "Deficiency" WHERE "coursepool" = $1 AND "user_id" = $2',
        [coursepool, user_id]
      );

      if (existingDeficiency.rows.length > 0) {
        throw new Error('Deficiency with this coursepool and user_id already exists. Please use the update endpoint');
      }

      const existingCoursePool = await conn.query(
        'SELECT * FROM "CoursePool" WHERE "id" = $1',
        [coursepool]
      );

      if (existingCoursePool.rows.length === 0) {
        throw new Error('CoursePool does not exist.');
      }

      const existingAppUser = await conn.query(
        'SELECT * FROM "AppUser" WHERE "id" = $1',
        [user_id]
      );

      if (existingAppUser.rows.length === 0) {
        throw new Error('AppUser does not exist.');
      }

      // Generate random id
      const id = randomUUID();

      await conn.query(
        'INSERT INTO "Deficiency" ("id", "coursepool", "user_id", "creditsRequired") VALUES ($1, $2, $3, $4)',
        [id, coursepool, user_id, creditsRequired]
      );

      return { id, coursepool, user_id, creditsRequired };
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
}

async function getAllDeficienciesByUser(
  user_id: string
): Promise<DeficiencyTypes.Deficiency[] | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if an appUser exists
      const existingAppUser = await conn.query(
        'SELECT * FROM "AppUser" WHERE "id" = $1',
        [user_id]
      );

      if (existingAppUser.rows.length === 0) {
        throw new Error('AppUser does not exist.');
      }

      // Return the updated deficiency
      const allDeficiencies = await conn.query(
        'SELECT * FROM "Deficiency" WHERE "user_id" = $1',
        [user_id]
      );

      return allDeficiencies.rows.length > 0 ? allDeficiencies.rows : undefined;
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
}

async function deleteDeficiencyByCoursepoolAndUserId(
  coursepool: string,
  user_id: string,
): Promise<string | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a deficiency with the given id exists
      const deficiency = await conn.query(
        'SELECT * FROM "Deficiency" WHERE "coursepool" = $1 AND "user_id" = $2',
        [coursepool, user_id]
      );

      if (deficiency.rows.length === 0) {
        throw new Error('Deficiency with this id does not exist.');
      }

      // Delete the deficiency
      await conn.query(
        'DELETE FROM "Deficiency" WHERE "coursepool" = $1 AND "user_id" = $2',
        [coursepool, user_id]
      );

      // Return success message
      return `Deficiency with appUser ${user_id} and coursepool ${coursepool} has been successfully deleted.`;
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
};

// Namespace
const deficiencyController = {
  createDeficiency,
  getAllDeficienciesByUser,
  deleteDeficiencyByCoursepoolAndUserId,
};

export default deficiencyController;
