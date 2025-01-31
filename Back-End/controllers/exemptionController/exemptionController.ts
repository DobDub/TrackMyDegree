import { randomUUID } from 'crypto';
import ExemptionTypes from "./exemption_types";
import DBController from '@controllers/DBController/DBController'; // Assuming this is the correct path

async function createExemption(
  coursecode: string,
  user_id: string
): Promise<ExemptionTypes.Exemption | undefined> {
  const client = await DBController.getConnection(); // Get the client from DBController

  if (!client) {
    throw new Error('Failed to connect to the database');
  }

  try {
    // Check if a course exists
    const existingCourseCode = await client.query(
      'SELECT * FROM Course WHERE code = $1',
      [coursecode]
    );

    if (existingCourseCode.rowCount === 0) {
      throw new Error(`Course with code '${coursecode}' does not exist.`);
    }

    // Check if an appUser exists
    const existingUser_id = await client.query(
      'SELECT * FROM AppUser WHERE id = $1',
      [user_id]
    );

    if (existingUser_id.rowCount === 0) {
      throw new Error(`AppUser with id '${user_id}' does not exist.`);
    }

    // Check if an exemption with the same coursecode and user_id already exists
    const existingExemption = await client.query(
      'SELECT * FROM Exemption WHERE coursecode = $1 AND user_id = $2',
      [coursecode, user_id]
    );

    if ((existingExemption.rowCount ?? 0) > 0) {
      throw new Error('Exemption with this coursecode and user_id already exists.');
    }

    // generate random id
    const id = randomUUID();

    // Insert new exemption record
    await client.query(
      'INSERT INTO Exemption (id, coursecode, user_id) VALUES ($1, $2, $3)',
      [id, coursecode, user_id]
    );

    return { id, coursecode, user_id };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

async function getAllExemptionsByUser(user_id: string): Promise<ExemptionTypes.Exemption[] | undefined> {
  const client = await DBController.getConnection(); // Get the client from DBController

  if (!client) {
    throw new Error('Failed to connect to the database');
  }

  try {
    // Check if a appUser exists
    const existingUser_id = await client.query(
      'SELECT * FROM AppUser WHERE id = $1',
      [user_id]
    );

    if (existingUser_id.rowCount === 0) {
      throw new Error(`AppUser with id '${user_id}' does not exist.`);
    }

    // Read all exemptions of a user
    const allExemptions = await client.query(
      'SELECT * FROM Exemption WHERE user_id = $1',
      [user_id]
    );

    if (allExemptions.rowCount === 0) {
      throw new Error(`No exemptions found for user with id '${user_id}'.`);
    }

    return allExemptions.rows;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

async function deleteExemptionByCoursecodeAndUserId(
  coursecode: string,
  user_id: string,
): Promise<string | undefined> {
  const client = await DBController.getConnection(); // Get the client from DBController

  if (!client) {
    throw new Error('Failed to connect to the database');
  }

  try {
    // Check if an exemption with the given id exists
    const exemption = await client.query(
      'SELECT * FROM Exemption WHERE coursecode = $1 AND user_id = $2',
      [coursecode, user_id]
    );

    if (exemption.rowCount === 0) {
      throw new Error('Exemption with this coursecode and user_id does not exist.');
    }

    // Delete the exemption
    await client.query(
      'DELETE FROM Exemption WHERE coursecode = $1 AND user_id = $2',
      [coursecode, user_id]
    );

    // Return success message
    return `Exemption with appUser ${user_id} and coursecode ${coursecode} has been successfully deleted.`;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Namespace
const exemptionController = {
  createExemption,
  getAllExemptionsByUser,
  deleteExemptionByCoursecodeAndUserId
};

export default exemptionController;
