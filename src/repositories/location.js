import pool from '../database/db.js';
import sql from '../../sql.js';

const { locations } = sql;

const insert = async ({
  name,
  timeZone,
  address
}, organisationId, client = pool) => {
  const text = locations.insert;
  const values = [name, timeZone, address, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  id,
  name,
  timeZone,
  address
}, organisationId, client = pool) => {
  const text = locations.update;
  const values = [id, name, timeZone, address, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const getById = async (locationId, organisationId, client = pool) => {
  const text = locations.getById;
  const values = [locationId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getSelectListItems = async (organisationId, client = pool) => {
  const text = locations.getItems;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const text = locations.find;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const remove = async (locationId, organisationId, client = pool) => {
  const text = locations.remove;
  const values = [locationId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
