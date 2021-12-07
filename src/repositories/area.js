import pool from '../database/db.js';
import sql from '../../sql';

const { areas } = sql;

const insert = async ({
  name,
  locationId,
  notes
}, organisationId, client = pool) => {
  const text = areas.insert;
  const values = [name, locationId, notes, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  id,
  name,
  locationId,
  notes
}, organisationId, client = pool) => {
  const text = areas.update;
  const values = [id, name, locationId, notes, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const getById = async (areaId, organisationId, client = pool) => {
  const text = areas.getById;
  const values = [areaId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getWithLocation = async (organisationId, client = pool) => {
  const text = areas.getWithLocation;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getSelectListItems = async (isAdmin, userId, organisationId, client = pool) => {
  const text = isAdmin ? areas.getItemsAsAdmin : areas.getItems;
  const values = isAdmin ? [organisationId] : [userId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const text = areas.find;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const remove = async (areaId, organisationId, client = pool) => {
  const text = areas.remove;
  const values = [areaId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  update,
  getById,
  getWithLocation,
  getSelectListItems,
  find,
  remove
};
