import Database from "@controllers/DBController/DBController";
import appUserTypes from "@controllers/appUserController/appUser_types";

async function updateAppUser(
  id: string,
  email: string,
  password: string,
  fullname: string,
  degree: string,
  type: appUserTypes.UserType
): Promise<appUserTypes.AppUser | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if the user exists
      const appUser = await conn.query(
        `SELECT * FROM AppUser WHERE id = $1`,
        [id]
      );

      if (appUser.rows.length === 0) {
        throw new Error("AppUser with this id does not exist.");
      }

      // Update the user
      await conn.query(
        `UPDATE AppUser 
          SET email = $1, 
              password = $2, 
              fullname = $3, 
              degree = $4, 
              type = $5 
          WHERE id = $6`,
        [email, password, fullname, degree, type, id]
      );

      // Fetch updated user
      const updatedAppUser = await conn.query(
        `SELECT * FROM AppUser WHERE id = $1`,
        [id]
      );

      return updatedAppUser.rows[0]; // PostgreSQL uses `.rows`
    } catch (error) {
      throw error;
    } finally {
      conn.release(); // PostgreSQL: Always release connection
    }
  }
}

async function deleteAppUser(id: string): Promise<string | undefined> {
  const conn = await Database.getConnection();

  if (conn) {
    try {
      // Check if user exists
      const appUser = await conn.query(
        `SELECT * FROM AppUser WHERE id = $1`,
        [id]
      );

      if (appUser.rows.length === 0) {
        throw new Error("AppUser with this id does not exist.");
      }

      // Delete user
      await conn.query(
        `DELETE FROM AppUser WHERE id = $1`,
        [id]
      );

      return `AppUser with id ${id} has been successfully deleted.`;
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }
}

// Namespace
const appUserController = {
  updateAppUser,
  deleteAppUser
};

export default appUserController;
