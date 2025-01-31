import CourseXCPTypes from '@controllers/CourseXCPController/CourseXCP_types';
import DB_OPS from '@Util/DB_Ops';
import { randomUUID } from 'crypto';
import DBController from '@controllers/DBController/DBController'; // Import DBController

const log = console.log;

async function createCourseXCP(new_record: CourseXCPTypes.CourseXCP): Promise<DB_OPS> {
  const client = await DBController.getConnection(); // Use DBController to get the client

  if (client) {
    const { coursecode, coursepool_id, group_id } = new_record;
    const record_id = randomUUID();

    try {
      const result = await client.query(
        'INSERT INTO "CourseXCoursePool" (id, coursecode, coursepool, group_id) ' +
        'VALUES ($1, $2, $3, $4) RETURNING id',
        [record_id, coursecode, coursepool_id, group_id || '']
      );

      if (result.rows.length === 0) {
        log("Error inserting courseXcoursepool record");
        return DB_OPS.MOSTLY_OK;
      } else {
        return DB_OPS.SUCCESS;
      }
    } catch (error) {
      log("Error in courseXcoursepool creation\n", error);
    } finally {
      client.release(); // Release the client back to the pool
    }
  }

  return DB_OPS.FAILURE;
}

async function getAllCourseXCP(coursepool_id: string): Promise<{ course_codes: string[] } | undefined> {
  const client = await DBController.getConnection(); // Use DBController to get the client

  if (client) {
    try {
      const result = await client.query(
        'SELECT coursecode FROM "CourseXCoursePool" WHERE coursepool = $1',
        [coursepool_id]
      );

      const codes = result.rows.map(row => row.coursecode);
      return { course_codes: codes };
    } catch (error) {
      log("Error fetching all course codes for given coursepool id\n", error);
    } finally {
      client.release(); // Release the client back to the pool
    }
  }

  return undefined;
}

async function updateCourseXCP(update_record: CourseXCPTypes.CourseXCPItem): Promise<DB_OPS> {
  const client = await DBController.getConnection(); // Use DBController to get the client

  if (client) {
    const { id, coursecode, coursepool_id, group_id } = update_record;

    try {
      const result = await client.query(
        'UPDATE "CourseXCoursePool" SET coursecode = $1, coursepool = $2, group_id = $3 ' +
        'WHERE id = $4 RETURNING id',
        [coursecode, coursepool_id, group_id || '', id]
      );

      if (result.rows.length > 0 && id === result.rows[0].id) {
        return DB_OPS.SUCCESS;
      } else {
        return DB_OPS.MOSTLY_OK;
      }
    } catch (error) {
      log('Error in updating courseXcoursepool item\n', error);
    } finally {
      client.release(); // Release the client back to the pool
    }
  }

  return DB_OPS.FAILURE;
}

async function removeDegreeXCP(delete_record: CourseXCPTypes.CourseXCP): Promise<DB_OPS> {
  const client = await DBController.getConnection(); // Use DBController to get the client

  if (client) {
    const { coursecode, coursepool_id, group_id } = delete_record;

    try {
      const result = await client.query(
        'DELETE FROM "CourseXCoursePool" WHERE coursecode = $1 AND coursepool = $2 AND group_id = $3 RETURNING coursecode',
        [coursecode, coursepool_id, group_id || '']
      );

      if (result.rows.length > 0 && result.rows[0].coursecode === coursecode) {
        return DB_OPS.SUCCESS;
      } else {
        return DB_OPS.MOSTLY_OK;
      }
    } catch (error) {
      log('Error in deleting degreeXcoursepool item\n', error);
    } finally {
      client.release(); // Release the client back to the pool
    }
  }

  return DB_OPS.FAILURE;
}

const CourseXCPController = {
  createCourseXCP,
  getAllCourseXCP,
  updateCourseXCP,
  removeDegreeXCP
};

export default CourseXCPController;
