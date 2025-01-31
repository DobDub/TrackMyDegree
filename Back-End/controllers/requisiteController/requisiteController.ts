import Database from "@controllers/DBController/DBController";
import RequisiteTypes from "@controllers/requisiteController/requisite_types";
import { randomUUID } from "crypto";

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
            const coursesCheck = await conn.query(`
                SELECT code
                FROM Course
                WHERE code IN ($1, $2);
            `, [code1, code2]);

            if (coursesCheck.rows.length < 2) {
                throw new Error(`One or both courses ('${code1}', '${code2}') do not exist.`);
            }

            // Check if a requisite with the same course combination already exists
            const existingRequisite = await conn.query(`
                SELECT * FROM Requisite 
                WHERE code1 = $1 AND code2 = $2 AND type = $3;
            `, [code1, code2, type]);

            if (existingRequisite.rows.length > 0) {
                throw new Error('Requisite with this combination of courses already exists.');
            }

            await conn.query(`
                INSERT INTO Requisite (id, code1, code2, type) 
                VALUES ($1, $2, $3, $4);
            `, [id, code1, code2, type]);

            return existingRequisite.rows[0];
        } catch (error) {
            throw error;
        } finally {
            conn.release();
        }
    }
};

async function readRequisite(
    code1: string,
    code2?: string, // Make code2 optional
    type?: RequisiteTypes.RequisiteType // Make type optional
): Promise<RequisiteTypes.Requisite[] | undefined> { // Return an array of requisites
    const conn = await Database.getConnection();

    if (conn) {
        try {
            // Check if code1 exists
            const coursesCheck = await conn.query(`
                SELECT code
                FROM Course
                WHERE code = $1;
            `, [code1]);

            if (coursesCheck.rows.length < 1) {
                throw new Error(`Course '${code1}' does not exist.`);
            }

            // If code2 and type are provided, search using all parameters
            if (code2 && type) {
                const existingRequisite = await conn.query(`
                    SELECT * FROM Requisite
                    WHERE code1 = $1 AND code2 = $2 AND type = $3;
                `, [code1, code2, type]);

                return existingRequisite.rows; // Return all matching requisites
            } else {
                // If only code1 is provided, search for requisites with code1
                const existingRequisite = await conn.query(`
                    SELECT * FROM Requisite 
                    WHERE code1 = $1;
                `, [code1]);

                return existingRequisite.rows; // Return all requisites for code1
            }

        } catch (error) {
            throw error;
        } finally {
            conn.release();
        }
    }
}

async function updateRequisite(
    code1: string,
    code2: string,
    type: RequisiteTypes.RequisiteType
): Promise<RequisiteTypes.Requisite | undefined> {
    const conn = await Database.getConnection();

    if (conn) {
        try {
            // Check if both courses exist
            const coursesCheck = await conn.query(`
                SELECT code
                FROM Course
                WHERE code IN ($1, $2);
            `, [code1, code2]);

            if (coursesCheck.rows.length < 2) {
                throw new Error(`One or both courses ('${code1}', '${code2}') do not exist.`);
            }

            // Check if a requisite with the same course combination already exists
            const existingRequisite = await conn.query(`
                SELECT * FROM Requisite 
                WHERE code1 = $1 AND code2 = $2 AND type = $3;
            `, [code1, code2, type]);

            if (existingRequisite.rows.length > 0) {
                throw new Error('Requisite with this combination of courses already exists.');
            }

            // Update the requisite with the new attributes
            await conn.query(`
                UPDATE Requisite 
                SET code1 = $1, code2 = $2, type = $3 
                WHERE id = $4;
            `, [code1, code2, type]);

            // Return the updated requisite
            const updatedRequisite = await conn.query(`
                SELECT * FROM Requisite 
                WHERE code1 = $1 AND code2 = $2 AND type = $3;
            `, [code1, code2, type]);

            return updatedRequisite.rows[0];
        } catch (error) {
            throw error;
        } finally {
            conn.release();
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
            const requisite = await conn.query(`
                SELECT * FROM Requisite 
                WHERE code1 = $1 AND code2 = $2 AND type = $3;
            `, [code1, code2, type]);

            if (requisite.rows.length === 0) {
                throw new Error('Requisite with this id does not exist.');
            }

            // Delete the requisite
            await conn.query(`
                DELETE FROM Requisite 
                WHERE code1 = $1 AND code2 = $2 AND type = $3;
            `, [code1, code2, type]);

            // Return success message
            return `Requisite with the course combination provided has been successfully deleted.`;
        } catch (error) {
            throw error;
        } finally {
            conn.release();
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
