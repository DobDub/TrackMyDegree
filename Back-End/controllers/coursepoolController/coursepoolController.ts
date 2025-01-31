import Database from '@controllers/DBController/DBController';
import DB_OPS from '@Util/DB_Ops';
import CoursePoolTypes from '@controllers/coursepoolController/coursepool_types';
import { randomUUID } from 'crypto';

const log = console.log;

async function createCoursePool(pool_name: string): Promise<DB_OPS> {
  const dbConn = await Database.getConnection();

  if (dbConn) {
    let record: CoursePoolTypes.CoursePoolItem = {
      id: randomUUID(),
      name: pool_name,
    };

    try {
      const result = await dbConn.query(
        'INSERT INTO CoursePool (id, name) VALUES ($1, $2) RETURNING id',
        [record.id, record.name]
      );

      if (!result.rows || result.rows.length === 0) {
        log('Error inserting coursepool record');
        return DB_OPS.MOSTLY_OK;
      } else {
        return DB_OPS.SUCCESS;
      }
    } catch (error) {
      log('Error in coursepool creation\n', error);
    }
  }

  return DB_OPS.FAILURE;
}

async function getAllCoursePools():
  Promise<{ course_pools: CoursePoolTypes.CoursePoolItem[] } | undefined> {
  const dbConn = await Database.getConnection();

  if (dbConn) {
    try {
      const result = await dbConn.query('SELECT * FROM CoursePool');

      return {
        course_pools: result.rows,
      };
    } catch (error) {
      log('Error fetching all course pools\n', error);
    }
  }

  return undefined;
}

async function getCoursePool(pool_id: string):
  Promise<CoursePoolTypes.CoursePoolItem | undefined> {
  const dbConn = await Database.getConnection();

  if (dbConn) {
    try {
      const result = await dbConn.query(
        'SELECT * FROM CoursePool WHERE id = $1',
        [pool_id]
      );

      return result.rows[0];
    } catch (error) {
      log('Error fetching course pool by ID\n', error);
    }
  }

  return undefined;
}

async function updateCoursePool(update_info: CoursePoolTypes.CoursePoolItem):
  Promise<DB_OPS> {
  const dbConn = await Database.getConnection();

  if (dbConn) {
    const { id, name } = update_info;

    try {
      const result = await dbConn.query(
        'UPDATE CoursePool SET name = $1 WHERE id = $2 RETURNING id',
        [name, id]
      );

      if (result.rows.length > 0 && id === result.rows[0].id) {
        return DB_OPS.SUCCESS;
      } else {
        return DB_OPS.MOSTLY_OK;
      }
    } catch (error) {
      log('Error in updating course pool item\n', error);
    }
  }

  return DB_OPS.FAILURE;
}

async function removeCoursePool(pool_id: string): Promise<DB_OPS> {
  const dbConn = await Database.getConnection();

  if (dbConn) {
    try {
      const result = await dbConn.query(
        'DELETE FROM CoursePool WHERE id = $1 RETURNING id',
        [pool_id]
      );

      if (result.rows.length > 0 && result.rows[0].id === pool_id) {
        return DB_OPS.SUCCESS;
      } else {
        return DB_OPS.MOSTLY_OK;
      }
    } catch (error) {
      log('Error in deleting course pool item\n', error);
    }
  }

  return DB_OPS.FAILURE;
}

const coursepoolController = {
  createCoursePool,
  getAllCoursePools,
  getCoursePool,
  updateCoursePool,
  removeCoursePool,
};

export default coursepoolController;
