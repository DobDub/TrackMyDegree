import Database from "@controllers/DBController/DBController"
import RequisiteTypes from "@controllers/requisiteController/requisite_types"

async function createRequisite(
    id: string, 
    code1: string, 
    code2: string, 
    type: RequisiteTypes.RequisiteType): Promise<RequisiteTypes.Requisite | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a requisite with the same id already exists
      const existingRequisite = await conn.request()
        .input('id', Database.msSQL.VarChar, id)
        .query('SELECT * FROM Requisite WHERE id = @id');

      if (existingRequisite.recordset.length > 0) {
        throw new Error('Requisite with this id already exists.');
      }

      // Check if course 1 exists
      const existingCourseCode1 = await conn.request()
        .input('code', Database.msSQL.VarChar, code1)
        .query('SELECT * FROM Course WHERE code = @code');

      if (existingCourseCode1.recordset.length === 0) {
        throw new Error(`Course with code '${code1}' does not exist.`);
      }

        // Check if course 2 exists
        const existingCourseCode2 = await conn.request()
        .input('code', Database.msSQL.VarChar, code2)
        .query('SELECT * FROM Course WHERE code = @code');

        if (existingCourseCode2.recordset.length === 0) {
        throw new Error(`Course with code '${code2}' does not exist.`);
        }


      await conn.request()
        .input('id', Database.msSQL.VarChar, id)
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query('INSERT INTO Requisite (id, code1, code2, type) VALUES (@id, @code1, @code2, @type)');

      return { id, code1, code2, type };
    } catch (error) {
      throw error;
    } finally {
      conn.close()
    }
  }
};


async function readRequisite(id: string): Promise<RequisiteTypes.Requisite | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a requisite with the id exists
      const requisite = await conn.request()
        .input('id', Database.msSQL.VarChar, id)
        .query('SELECT * FROM Requisite WHERE id = @id');

      if (requisite.recordset.length === 0) {
        throw new Error('Requisite with this id does not exist.');
      }

      return requisite.recordset[0];
    } catch (error) {
      throw error;
    } finally {
      conn.close();
    }
  }
};


async function updateRequisite(
    id: string, 
    code1: string, 
    code2: string, 
    type: RequisiteTypes.RequisiteType
): Promise<RequisiteTypes.Requisite | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a requisite with the id exists
      const requisite = await conn
        .request()
        .input('id', Database.msSQL.VarChar, id)
        .query('SELECT * FROM Requisite WHERE id = @id');

      if (requisite.recordset.length === 0) {
        throw new Error('Requisite with this id does not exist.');
      }

      // Check if course 1 exists
      const existingCourseCode1 = await conn.request()
        .input('code', Database.msSQL.VarChar, code1)
        .query('SELECT * FROM Course WHERE code = @code');

      if (existingCourseCode1.recordset.length === 0) {
        throw new Error(`Course with code '${code1}' does not exist.`);
      }

        // Check if course 2 exists
        const existingCourseCode2 = await conn.request()
        .input('code', Database.msSQL.VarChar, code2)
        .query('SELECT * FROM Course WHERE code = @code');

        if (existingCourseCode2.recordset.length === 0) {
        throw new Error(`Course with code '${code2}' does not exist.`);
        }


      // Update the requisite with the new attributes
      await conn
        .request()
        .input('id', Database.msSQL.VarChar, id)
        .input('code1', Database.msSQL.VarChar, code1)
        .input('code2', Database.msSQL.VarChar, code2)
        .input('type', Database.msSQL.VarChar, type)
        .query(
          'UPDATE Requisite SET code1 = @code1, code2 = @code2, type = @type WHERE id = @id'
        );

      // Return the updated requisite
      const updatedRequisite= await conn
        .request()
        .input('id', Database.msSQL.VarChar, id)
        .query('SELECT * FROM Requisite WHERE id = @id');

      return updatedRequisite.recordset[0];
    } catch (error) {
      throw error;
    } finally {
      conn.close();
    }
  }
}

async function deleteRequisite(id: string): Promise<string | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a requisite with the given id exists
      const requisite = await conn
        .request()
        .input('id', Database.msSQL.VarChar, id)
        .query('SELECT * FROM Requisite WHERE id = @id');

      if (requisite.recordset.length === 0) {
        throw new Error('Requisite with this id does not exist.');
      }

      // Delete the requisite
      await conn
        .request()
        .input('id', Database.msSQL.VarChar, id)
        .query('DELETE FROM Requisite WHERE id = @id');

      // Return success message
      return `Requisite with id ${id} has been successfully deleted.`;
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