import Database from '@controllers/DBController/DBController'
import TimelineTypes from '@controllers/timelineController/timeline_types'
import DB_OPS from '@Util/DB_Ops';
import { randomUUID } from 'crypto'

const log = console.log;

async function createTimeline(userTimeline: TimelineTypes.UserTimeline):
  Promise<DB_OPS> {

  let record;
  const dbConn = await Database.getConnection();
  let successfulInserts = 0;

  if (dbConn) {
    const { timeline_items } = userTimeline;

    for (let i = 0; i < timeline_items.length; i++) {
      record = {
        id: randomUUID(),
        course_item: timeline_items[i],
        user_id: userTimeline.user_id
      };

      try {
        const courseItem = record.course_item;
        const result = await dbConn.query(
          'INSERT INTO Timeline (id, season, year, coursecode, user_id) ' +
          'VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [record.id, courseItem.season, courseItem.year, courseItem.coursecode, record.user_id]
        );

        if (!result.rows || result.rows.length === 0) {
          log("Error inserting timeline record ", result.rows);
        } else {
          successfulInserts++;
        }
      } catch (error) {
        log("Error in Timeline creation\n", error);
      }
    }

    if (successfulInserts === userTimeline.timeline_items.length) {
      return DB_OPS.SUCCESS;
    } else {
      return DB_OPS.MOSTLY_OK;
    }
  }

  return DB_OPS.FAILURE;
}

async function getAllTimelines(user_id: string):
  Promise<TimelineTypes.UserTimeline | undefined> {

  const dbConn = await Database.getConnection();

  if (dbConn) {
    try {
      const result = await dbConn.query(
        'SELECT id, season, year, coursecode FROM Timeline WHERE user_id = $1',
        [user_id]
      );

      const timeline_courses = result.rows;

      return {
        user_id: user_id,
        timeline_items: timeline_courses
      }

    } catch (error) {
      log("Error fetching all user timelines\n", error);
    }
  }

  return undefined;
}

async function removeTimelineItem(timeline_item_id: string):
  Promise<DB_OPS> {

  const dbConn = await Database.getConnection();

  if (dbConn) {
    try {
      const result = await dbConn.query(
        'DELETE FROM Timeline WHERE id = $1 RETURNING id',
        [timeline_item_id]
      );

      if (result.rows.length > 0 && result.rows[0].id === timeline_item_id) {
        return DB_OPS.SUCCESS;
      } else {
        return DB_OPS.MOSTLY_OK;
      }

    } catch (error) {
      log('Error removing timeline item\n', error);
    }
  }

  return DB_OPS.FAILURE;
}

const timelineController = {
  createTimeline,
  getAllTimelines,
  removeTimelineItem
};

export default timelineController;
