import pool from '../database/db.js';
import sql from '../../sql';

const { organisations } = sql;

const insert = async ({
  name
}, client = pool) => {
  const text = organisations.insert;
  const values = [name];
  const result = await client.query(text, values);
  return result.rows[0].id;
}

const getById = async (organisationId, client = pool) => {
  const text = organisations.getById;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const update = async ({
  name,
  logoImageId
}, organisationId, client = pool) => {
  const text = organisations.update;
  const values = [name, logoImageId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const remove = async (organisationId, client = pool) => {
  const text = organisations.remove;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  getById,
  update,
  remove
};
