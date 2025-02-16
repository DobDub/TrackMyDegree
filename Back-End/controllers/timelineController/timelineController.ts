import Database from "@controllers/DBController/DBController";
import TimelineTypes from "@controllers/timelineController/timeline_types";
import { v4 as uuidv4 } from "uuid";

const log = console.log;

/**
 * Saves a timeline. If a timeline for the same user_id and name already exists, it is updated (overwritten).
 * The timeline JSON is expected to include a list of timeline items (each with season, year, and courses).
 */
async function saveTimeline(
  timeline: TimelineTypes.Timeline
): Promise<TimelineTypes.Timeline | undefined> {
  const dbConn = await Database.getConnection();
  if (!dbConn) return undefined;

  const { user_id, name, items } = timeline;
  if (!user_id || !name) {
    throw new Error("User ID and timeline name are required");
  }

  try {
    const existingTimelineResult = await dbConn
      .request()
      .input("user_id", Database.msSQL.VarChar, user_id)
      .input("name", Database.msSQL.VarChar, name)
      .query(`SELECT id FROM Timeline WHERE user_id = @user_id AND name = @name`);

    let timelineId: string;
    const lastModified = new Date(); // Current timestamp

    if (existingTimelineResult.recordset.length > 0) {
      // Timeline exists—use its id and update last_modified.
      timelineId = existingTimelineResult.recordset[0].id;

      // Remove existing timeline items and associated courses
      const itemsResult = await dbConn
        .request()
        .input("timelineId", Database.msSQL.VarChar, timelineId)
        .query(`SELECT id FROM TimelineItems WHERE timeline_id = @timelineId`);

      const timelineItemIds = itemsResult.recordset.map((item: any) => item.id);

      if (timelineItemIds.length > 0) {
        await dbConn.request().query(
          `DELETE FROM TimelineItemXCourses WHERE timeline_item_id IN (${timelineItemIds
            .map((id: string) => `'${id}'`)
            .join(",")})`
        );
        await dbConn
          .request()
          .input("timelineId", Database.msSQL.VarChar, timelineId)
          .query(`DELETE FROM TimelineItems WHERE timeline_id = @timelineId`);
      }

      // Update last_modified timestamp
      await dbConn
        .request()
        .input("timelineId", Database.msSQL.VarChar, timelineId)
        .input("lastModified", Database.msSQL.DateTime, lastModified)
        .query(`UPDATE Timeline SET last_modified = @lastModified WHERE id = @timelineId`);
    } else {
      // Insert new timeline with last_modified
      timelineId = uuidv4();
      await dbConn
        .request()
        .input("id", Database.msSQL.VarChar, timelineId)
        .input("user_id", Database.msSQL.VarChar, user_id)
        .input("name", Database.msSQL.VarChar, name)
        .input("lastModified", Database.msSQL.DateTime, lastModified)
        .query(
          `INSERT INTO Timeline (id, user_id, name, last_modified) VALUES (@id, @user_id, @name, @lastModified)`
        );
    }

    for (const item of items) {
      const timelineItemId = uuidv4();
      await dbConn
        .request()
        .input("id", Database.msSQL.VarChar, timelineItemId)
        .input("timelineId", Database.msSQL.VarChar, timelineId)
        .input("season", Database.msSQL.VarChar, item.season)
        .input("year", Database.msSQL.Int, item.year)
        .query(
          `INSERT INTO TimelineItems (id, timeline_id, season, year) VALUES (@id, @timelineId, @season, @year)`
        );

      for (const courseCode of item.courses) {
        await dbConn
          .request()
          .input("timelineItemId", Database.msSQL.VarChar, timelineItemId)
          .input("courseCode", Database.msSQL.VarChar, courseCode)
          .query(
            `INSERT INTO TimelineItemXCourses (timeline_item_id, coursecode) VALUES (@timelineItemId, @courseCode)`
          );
      }
    }

    return {
      id: timelineId,
      user_id,
      name,
      last_modified: lastModified,
      items,
    };
  } catch (error) {
    log("Error saving timeline\n", error);
    throw error;
  }
}


/**
 * Retrieves all timelines for the given user.
 * Each timeline returned includes its items and the associated course codes.
 */
async function getTimelinesByUser(
  user_id: string
): Promise<TimelineTypes.Timeline[] | undefined> {
  const dbConn = await Database.getConnection();
  if (!dbConn) return undefined;

  try {
    const timelinesResult = await dbConn
      .request()
      .input("user_id", Database.msSQL.VarChar, user_id)
      .query(`SELECT id, user_id, name, last_modified FROM Timeline WHERE user_id = @user_id`);

    const timelinesRecords = timelinesResult.recordset;
    if (timelinesRecords.length === 0) return [];

    const timelines: TimelineTypes.Timeline[] = [];
    for (const tl of timelinesRecords) {
      const itemsResult = await dbConn
        .request()
        .input("timelineId", Database.msSQL.VarChar, tl.id)
        .query(`
          SELECT ti.id AS itemId, ti.season, ti.year, tic.coursecode
          FROM TimelineItems ti
          LEFT JOIN TimelineItemXCourses tic ON ti.id = tic.timeline_item_id
          WHERE ti.timeline_id = @timelineId
          ORDER BY ti.year, ti.season
        `);

      const itemsMap: { [key: string]: TimelineTypes.TimelineItem } = {};
      itemsResult.recordset.forEach((row: any) => {
        if (!itemsMap[row.itemId]) {
          itemsMap[row.itemId] = {
            id: row.itemId,
            season: row.season,
            year: row.year,
            courses: [],
          };
        }
        if (row.coursecode) {
          itemsMap[row.itemId].courses.push(row.coursecode);
        }
      });

      const items = Object.values(itemsMap);
      timelines.push({
        id: tl.id,
        user_id: tl.user_id,
        name: tl.name,
        last_modified: tl.last_modified, // Include last_modified
        items,
      });
    }
    return timelines;
  } catch (error) {
    log("Error fetching timelines for user\n", error);
    throw error;
  }
}
async function removeUserTimeline(timeline_id: string): Promise<string> {
  const dbConn = await Database.getConnection();

  if (!dbConn) {
    return "Database connection failed.";
  }

  try {
    const result = await dbConn.request()
      .input("id", Database.msSQL.VarChar, timeline_id)
      .query(`
        DELETE FROM Timeline
        OUTPUT DELETED.id
        WHERE id = @id
      `);

    if (result.recordset.length > 0) {
      return `Timeline with id: ${result.recordset[0].id} deleted successfully`;
    } else {
      return `No timeline found with id: ${timeline_id}`;
    }
  } catch (error) {
    log("Error removing timeline item\n", error);
    return "Error occurred while deleting timeline.";
  }
}



const timelineController = {
  saveTimeline,
  getTimelinesByUser,
  removeUserTimeline
};

export default timelineController;