import pool from '../database/db.js';
import sql from '../../sql.js';

const { shiftRoles } = sql;

const insert = async ({
  seriesId,
  roleId,
  capacity
}, organisationId, client = pool) => {
  const text = shiftRoles.insert;
  const values = [
    seriesId,
    roleId,
    capacity,
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const copy = async (fromSeriesId, toSeriesId, organisationId, client = pool) => {
  const text = shiftRoles.copy;
  const values = [fromSeriesId, toSeriesId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  id,
  seriesId,
  roleId,
  capacity
}, organisationId, client = pool) => {
  const text = id ? shiftRoles.update : shiftRoles.updateBySeriesId;
  const values = id ? [id, capacity, organisationId] : [seriesId, roleId, capacity, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const remove = async ({
  id,
  seriesId,
  roleId
}, organisationId, client = pool) => {
  const text = id ? shiftRoles.remove : shiftRoles.removeBySeriesId;
  const values = id ? [id, organisationId] : [seriesId, roleId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  copy,
  update,
  remove
};
