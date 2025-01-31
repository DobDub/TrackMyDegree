import Database from "@controllers/DBController/DBController";
import { randomUUID } from "crypto";
// types import
import Auth from "@controllers/authController/auth_types";
import bcrypt from "bcryptjs";

const log = console.log;

// Functions
async function authenticate(email: string, password: string): Promise<Auth.UserInfo | undefined> {
  const authConn = await Database.getConnection();

  if (authConn) {
    try {
      // Step 1: Query the database for the user by email only
      const result = await authConn.query(
        `SELECT * FROM AppUser WHERE email = $1`,
        [email]
      );

      // Step 2: Check if user exists and if the password matches
      if (result.rows && result.rows.length > 0) {
        const user = result.rows[0];

        // Compare the plain-text password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
          return user; // Authentication successful
        } else {
          log("Incorrect email or password", email, password);
        }
      } else {
        log("User not found", email);
      }
    } catch (error) {
      log("Error in login\n", error);
    }
  }

  return undefined;
}

async function registerUser(userInfo: Auth.UserInfo): Promise<{ id: string } | undefined> {
  const authConn = await Database.getConnection();

  if (authConn) {
    const { email, password, fullname, type } = userInfo;
    const id = randomUUID();

    try {
      const result = await authConn.query(
        `INSERT INTO AppUser (id, email, password, fullname, type) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [id, email, password, fullname, type]
      );

      if (!result.rows || result.rows.length === 0) {
        log("Error inserting record ", result.rows);
      } else {
        return { id: result.rows[0].id };
      }
    } catch (error) {
      log("Error in Sign Up\n", error);
    }
  }

  return undefined;
}

// Namespace
const authController = {
  authenticate,
  registerUser,
};

// Default export
export default authController;
