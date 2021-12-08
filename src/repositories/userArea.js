import pool from '../database/db.js';
import sql from '../../sql.js';

const { userAreas } = sql;

const insert = async ({
  userId,
  areaId,
  roleId,
  startTime,
  endTime,
  isAdmin
}, organisationId, client = pool) => {
  const text = userAreas.insert;
  const values = [
    userId, 
    areaId, 
    roleId, 
    startTime, 
    endTime, 
    isAdmin, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  id,
  userId,
  areaId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const text = userAreas.update;
  const values = [
    id,
    userId, 
    areaId, 
    startTime, 
    endTime, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const find = async (userId, organisationId, client = pool) => {
  const text = userAreas.find;
  const values = [userId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const remove = async (userAreaId, organisationId, client = pool) => {
  const text = userAreas.remove;
  const values = [userAreaId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  update,
  find,
  remove
};
