import Database from "@controllers/DBController/DBController"
import RequisiteTypes from "@controllers/requisiteController/requisite_types"
import { randomUUID } from "crypto"

async function createRequisite(
    code1: string, 
    code2: string, 
    type: RequisiteTypes.RequisiteType): Promise<RequisiteTypes.Requisite | undefined> {
  const conn = await Database.getConnection();
  
  if (conn) {
    try {
      // generate random id
      const id = randomUUID();
      // Check if both courses exist
      const coursesCheck = await conn.request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .query(`
          SELECT code
          FROM Course
          WHERE code IN (@code1, @code2);
        `);

      if (coursesCheck.recordset.length < 2) {
        throw new Error(`One or both courses ('${code1}', '${code2}') do not exist.`);
      }

      // Check if a requisite with the same course combination already exists
      const existingRequisite = await conn.request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('SELECT * FROM Requisite WHERE code1 = @code1 AND code2 = @code2 AND type = @type');

      if (existingRequisite.recordset.length > 0) {
        throw new Error('Requisite with this combination of courses already exists.');
      }


      await conn.request()
        .input('id', Database.msSQL.VarChar, id)
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('INSERT INTO Requisite (id, code1, code2, type) VALUES (@id, @code1, @code2, @type)');

      return existingRequisite.recordset[0];
    } catch (error) {
      throw error;
    } finally {
      conn.close()
    }
  }
};


async function readRequisite(    
  code1: string, 
  code2: string, 
  type: RequisiteTypes.RequisiteType): Promise<RequisiteTypes.Requisite | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if both courses exist
      const coursesCheck = await conn.request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .query(`
          SELECT code
          FROM Course
          WHERE code IN (@code1, @code2);
        `);

      if (coursesCheck.recordset.length < 2) {
        throw new Error(`One or both courses ('${code1}', '${code2}') do not exist.`);
      }

      // attempting to read the requisite with the course combination provided
      const existingRequisite = await conn.request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('SELECT * FROM Requisite WHERE code1 = @code1 AND code2 = @code2 AND type = @type');

      if (existingRequisite.recordset.length > 0) {
        return existingRequisite.recordset[0];      
      }
      else {
        throw new Error("The course combination provided does not exist")
      }
    } catch (error) {
      throw error;
    } finally {
      conn.close();
    }
  }
};


async function updateRequisite(
    code1: string, 
    code2: string, 
    type: RequisiteTypes.RequisiteType
): Promise<RequisiteTypes.Requisite | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if both courses exist
      const coursesCheck = await conn.request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .query(`
          SELECT code
          FROM Course
          WHERE code IN (@code1, @code2);
        `);

      if (coursesCheck.recordset.length < 2) {
        throw new Error(`One or both courses ('${code1}', '${code2}') do not exist.`);
      }

      // Check if a requisite with the same course combination already exists
      const existingRequisite = await conn.request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('SELECT * FROM Requisite WHERE code1 = @code1 AND code2 = @code2 AND type = @type');

      if (existingRequisite.recordset.length > 0) {
        throw new Error('Requisite with this combination of courses already exists.');
      }


      // Update the requisite with the new attributes
      await conn
        .request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query(
          'UPDATE Requisite SET code1 = @code1, code2 = @code2, type = @type WHERE id = @id'
        );

      // Return the updated requisite
      const updatedRequisite= await conn
        .request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('SELECT * FROM Requisite WHERE code1 = @code1 AND code2 = @code2 AND type = @type');

      return updatedRequisite.recordset[0];
    } catch (error) {
      throw error;
    } finally {
      conn.close();
    }
  }
}

async function deleteRequisite(
  code1: string, 
  code2: string, 
  type: RequisiteTypes.RequisiteType
): Promise<string | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a requisite with the given id exists
      const requisite = await conn
        .request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('SELECT * FROM Requisite WHERE code1 = @code1 AND code2 = @code2 AND type = @type');

      if (requisite.recordset.length === 0) {
        throw new Error('Requisite with this id does not exist.');
      }

      // Delete the requisite
      await conn
        .request()
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('DELETE FROM Requisite WHERE code1 = @code1 AND code2 = @code2 AND type = @type');

      // Return success message
      return `Requisite with the course combination provided has been successfully deleted.`;
    } catch (error) {
      throw error;
    } finally {
      conn.close();
    }
  }
};

//Namespace
const requisiteController = {
  createRequisite,
  readRequisite,
  updateRequisite,
  deleteRequisite
};

export default requisiteController;