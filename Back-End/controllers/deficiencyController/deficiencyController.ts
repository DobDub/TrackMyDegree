import Database from '@controllers/DBController/DBController';
import DeficiencyTypes from '@controllers/deficiencyController/deficiency_types';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';

/**
 * Creates a new deficiency for a user and coursepool.
 *
 * @param {string} coursepool - The ID of the course pool.
 * @param {string} user_id - The ID of the user.
 * @param {number} creditsRequired - The number of credits required to resolve the deficiency.
 * @returns {Promise<DeficiencyTypes.Deficiency | undefined>} - The created deficiency or undefined if failed.
 */
async function createDeficiency(
  coursepool: string,
  user_id: string,
  creditsRequired: number,
): Promise<DeficiencyTypes.Deficiency | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a deficiency with the same attributes already exists
      const existingDeficiency = await conn
        .request()
        .input('coursepool', Database.msSQL.VarChar, coursepool)
        .input('user_id', Database.msSQL.VarChar, user_id)
        .query(
          'SELECT * FROM Deficiency WHERE coursepool = @coursepool AND user_id = @user_id',
        );

      if (existingDeficiency.recordset.length > 0) {
        throw new Error(
          'Deficiency with this coursepool and user_id already exists. Please use the update endpoint',
        );
      }

      const existingCoursePool = await conn
        .request()
        .input('id', Database.msSQL.VarChar, coursepool)
        .query('SELECT * FROM CoursePool WHERE id = @id');

      if (existingCoursePool.recordset.length === 0) {
        throw new Error('CoursePool does not exist.');
      }

      const existingAppUser = await conn
        .request()
        .input('id', Database.msSQL.VarChar, user_id)
        .query('SELECT * FROM AppUser WHERE id = @id');

      if (existingAppUser.recordset.length === 0) {
        throw new Error('AppUser does not exist.');
      }

      // Generate random id
      const id = randomUUID();

      await conn
        .request()
        .input('id', Database.msSQL.VarChar, id)
        .input('coursepool', Database.msSQL.VarChar, coursepool)
        .input('user_id', Database.msSQL.VarChar, user_id)
        .input('creditsRequired', Database.msSQL.Int, creditsRequired)
        .query(
          'INSERT INTO Deficiency (id, coursepool, user_id, creditsRequired) VALUES (@id, @coursepool, @user_id, @creditsRequired)',
        );

      return { id, coursepool, user_id, creditsRequired };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    } finally {
      conn.close();
    }
  }
}

/**
 * Retrieves all deficiencies for a specific user.
 *
 * @param {string} user_id - The ID of the user.
 * @returns {Promise<DeficiencyTypes.Deficiency[] | undefined>} - List of deficiencies or undefined if not found.
 */
async function getAllDeficienciesByUser(
  user_id: string,
): Promise<DeficiencyTypes.Deficiency[] | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a appUser exists
      const existingAppUser = await conn
        .request()
        .input('id', Database.msSQL.VarChar, user_id)
        .query('SELECT * FROM AppUser WHERE id = @id');

      if (existingAppUser.recordset.length === 0) {
        throw new Error('AppUser does not exist.');
      }

      // Return the updated deficiency
      const allDeficiencies = await conn
        .request()
        .input('user_id', Database.msSQL.VarChar, user_id)
        .query('SELECT * FROM Deficiency WHERE user_id = @user_id');

      return allDeficiencies.recordset.length > 0
        ? allDeficiencies.recordset
        : undefined;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    } finally {
      conn.close();
    }
  }
}
/**
 * Deletes a deficiency based on course pool and user ID.
 *
 * @param {string} coursepool - The ID of the course pool.
 * @param {string} user_id - The ID of the user.
 * @returns {Promise<string | undefined>} - Success message or undefined if deletion fails.
 */

async function deleteDeficiencyByCoursepoolAndUserId(
  coursepool: string,
  user_id: string,
): Promise<string | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a deficiency with the given id exists
      const deficiency = await conn
        .request()
        .input('coursepool', Database.msSQL.VarChar, coursepool)
        .input('user_id', Database.msSQL.VarChar, user_id)
        .query(
          'SELECT * FROM Deficiency WHERE coursepool = @coursepool AND user_id = @user_id',
        );

      if (deficiency.recordset.length === 0) {
        throw new Error('Deficiency with this id does not exist.');
      }

      // Delete the deficiency
      await conn
        .request()
        .input('coursepool', Database.msSQL.VarChar, coursepool)
        .input('user_id', Database.msSQL.VarChar, user_id)
        .query(
          'DELETE FROM Deficiency WHERE coursepool = @coursepool AND user_id = @user_id',
        );

      // Return success message
      return `Deficiency with appUser ${user_id} and coursepool ${coursepool} has been successfully deleted.`;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    } finally {
      conn.close();
    }
  }
}

//Namespace
const deficiencyController = {
  createDeficiency,
  getAllDeficienciesByUser,
  deleteDeficiencyByCoursepoolAndUserId,
};

export default deficiencyController;
