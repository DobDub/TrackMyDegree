import Database from "@controllers/DBController/DBController";
import DegreeTypes from "@controllers/degreeController/degree_types";

async function createDegree(id: string, name: string, totalCredits: number): Promise<DegreeTypes.Degree | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a degree with the same id or name already exists
      const existingDegree = await conn.query(
        'SELECT * FROM Degree WHERE id = $1 OR name = $2',
        [id, name]
      );

      if ((existingDegree?.rowCount ?? 0) > 0) {
        throw new Error('Degree with this id or name already exists.');
      }


      await conn.query(
        'INSERT INTO Degree (id, name, totalCredits) VALUES ($1, $2, $3)',
        [id, name, totalCredits]
      );

      return { id, name, totalCredits };
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
};

async function readDegree(id: string): Promise<DegreeTypes.Degree | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a degree with the id exists
      const degree = await conn.query(
        'SELECT * FROM Degree WHERE id = $1',
        [id]
      );

      if (degree?.rowCount === 0) { // Safe null check
        throw new Error('Degree with this id does not exist.');
      }

      return degree.rows[0];
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
};

async function readAllDegrees(): Promise<DegreeTypes.Degree[] | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      const degrees = await conn.query('SELECT * FROM Degree');

      return degrees.rows;
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
};

async function updateDegree(id: string, name: string, totalCredits: number): Promise<DegreeTypes.Degree | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a degree with the id exists
      const degree = await conn.query(
        'SELECT * FROM Degree WHERE id = $1',
        [id]
      );

      if (degree?.rowCount === 0) { // Safe null check
        throw new Error('Degree with this id does not exist.');
      }

      // Update the degree with the new name and totalCredits
      await conn.query(
        'UPDATE Degree SET name = $1, totalCredits = $2 WHERE id = $3',
        [name, totalCredits, id]
      );

      // Return the updated degree
      const updatedDegree = await conn.query(
        'SELECT * FROM Degree WHERE id = $1',
        [id]
      );

      return updatedDegree.rows[0];
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
}

async function deleteDegree(id: string): Promise<string | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if a degree with the given id exists
      const degree = await conn.query(
        'SELECT * FROM Degree WHERE id = $1',
        [id]
      );

      if (degree?.rowCount === 0) { // Safe null check
        throw new Error('Degree with this id does not exist.');
      }

      // Delete the degree
      await conn.query(
        'DELETE FROM Degree WHERE id = $1',
        [id]
      );

      // Return success message
      return `Degree with id ${id} has been successfully deleted.`;
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
};

//Namespace
const degreeController = {
  createDegree,
  readDegree,
  updateDegree,
  deleteDegree,
  readAllDegrees
};

export default degreeController;
