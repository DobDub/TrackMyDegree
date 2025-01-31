import { Request, Response } from "express";
import Database from "@controllers/DBController/DBController";
import { UserDataResponse } from "./user_data_types";

export const getUserData = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.body;

    if (!id) {
        res.status(400).json({ message: "User ID is required" });
        return;
    }

    const conn = await Database.getConnection(); // Ensure this returns a PostgreSQL client

    if (!conn) {
        res.status(500).json({ message: "Database connection failed" });
        return;
    }

    try {
        // Check if the user exists
        const userCheckResult = await conn.query(
            `SELECT id FROM "AppUser" WHERE id = $1`,
            [id]
        );

        if (userCheckResult.rows.length === 0) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Fetch timeline
        const timelineResult = await conn.query(
            `SELECT season, year, coursecode 
             FROM "Timeline" 
             WHERE user_id = $1`,
            [id]
        );

        // Fetch deficiencies
        const deficiencyResult = await conn.query(
            `SELECT coursepool, creditsRequired 
             FROM "Deficiency" 
             WHERE user_id = $1`,
            [id]
        );

        // Fetch exemptions
        const exemptionResult = await conn.query(
            `SELECT coursecode 
             FROM "Exemption" 
             WHERE user_id = $1`,
            [id]
        );

        // Fetch degree
        const degreeResult = await conn.query(
            `SELECT "Degree".id, "Degree".name, "Degree".totalCredits 
             FROM "AppUser" 
             JOIN "Degree" ON "AppUser".degree = "Degree".id 
             WHERE "AppUser".id = $1`,
            [id]
        );

        // Combine data into a structured response
        const response: UserDataResponse = {
            timeline: timelineResult.rows,
            deficiencies: deficiencyResult.rows,
            exemptions: exemptionResult.rows,
            degree: degreeResult.rows[0] || null,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export default getUserData;
