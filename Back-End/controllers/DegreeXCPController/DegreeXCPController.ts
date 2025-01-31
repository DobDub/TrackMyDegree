import DegreeXCPTypes from '@controllers/DegreeXCPController/DegreeXCP_types';
import CoursePoolTypes from '@controllers/coursepoolController/coursepool_types';
import DB_OPS from '@Util/DB_Ops';
import { randomUUID } from 'crypto';
import DBController from '@controllers/DBController/DBController'; // Import DBController

const log = console.log;

async function createDegreeXCP(new_record: DegreeXCPTypes.NewDegreeXCP): Promise<DB_OPS> {
  const { degree_id, coursepool_id, credits } = new_record;
  const record_id = randomUUID();

  const client = await DBController.getConnection();
  if (!client) return DB_OPS.FAILURE;

  try {
    const result = await client.query(
      'INSERT INTO DegreeXCoursePool (id, degree, coursepool, creditsRequired) ' +
      'VALUES ($1, $2, $3, $4) RETURNING id',
      [record_id, degree_id, coursepool_id, credits]
    );

    if (result.rows.length === 0) {
      log('Error inserting degreeXcoursepool record');
      return DB_OPS.MOSTLY_OK;
    } else {
      return DB_OPS.SUCCESS;
    }
  } catch (error) {
    log('Error in degreeXcoursepool creation\n', error);
  } finally {
    client.release(); // Release client back to the pool
  }

  return DB_OPS.FAILURE;
}

async function getAllDegreeXCP(degree_id: string): Promise<{ course_pools: CoursePoolTypes.CoursePoolItem[] } | undefined> {
  const client = await DBController.getConnection();
  if (!client) return undefined;

  try {
    const result = await client.query(
      'SELECT cp.id, cp.name ' +
      'FROM CoursePool cp ' +
      'JOIN DegreeXCoursePool dxcp ON cp.id = dxcp.coursepool ' +
      'WHERE dxcp.degree = $1',
      [degree_id]
    );

    return {
      course_pools: result.rows
    };
  } catch (error) {
    log('Error fetching all course pools for given degree id\n', error);
  } finally {
    client.release(); // Release client back to the pool
  }

  return undefined;
}

async function updateDegreeXCP(update_record: DegreeXCPTypes.DegreeXCPItem): Promise<DB_OPS> {
  const { id, degree_id, coursepool_id, credits } = update_record;

  const client = await DBController.getConnection();
  if (!client) return DB_OPS.FAILURE;

  try {
    const result = await client.query(
      'UPDATE DegreeXCoursePool ' +
      'SET degree = $1, coursepool = $2, creditsRequired = $3 ' +
      'WHERE id = $4 RETURNING id',
      [degree_id, coursepool_id, credits, id]
    );

    if (result.rows.length > 0 && id === result.rows[0].id) {
      return DB_OPS.SUCCESS;
    } else {
      return DB_OPS.MOSTLY_OK;
    }
  } catch (error) {
    log('Error in updating degreeXcoursepool item\n', error);
  } finally {
    client.release(); // Release client back to the pool
  }

  return DB_OPS.FAILURE;
}

async function removeDegreeXCP(delete_record: DegreeXCPTypes.DegreeXCP): Promise<DB_OPS> {
  const { degree_id, coursepool_id } = delete_record;

  const client = await DBController.getConnection();
  if (!client) return DB_OPS.FAILURE;

  try {
    const result = await client.query(
      'DELETE FROM DegreeXCoursePool ' +
      'WHERE degree = $1 AND coursepool = $2 RETURNING degree',
      [degree_id, coursepool_id]
    );

    if (result.rows.length > 0 && result.rows[0].degree === degree_id) {
      return DB_OPS.SUCCESS;
    } else {
      return DB_OPS.MOSTLY_OK;
    }
  } catch (error) {
    log('Error in deleting degreeXcoursepool item\n', error);
  } finally {
    client.release(); // Release client back to the pool
  }

  return DB_OPS.FAILURE;
}

const DegreeXCPController = {
  createDegreeXCP,
  getAllDegreeXCP,
  updateDegreeXCP,
  removeDegreeXCP
};

export default DegreeXCPController;
