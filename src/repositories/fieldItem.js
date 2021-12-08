import pool from '../database/db.js';
import sql from '../../sql.js';

const { fieldItems } = sql;

const insert = async ({
  fieldId,
  name,
  itemNumber
}, organisationId, client = pool) => {
  const text = fieldItems.insert;
  const values = [fieldId, name, itemNumber, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  id,
  name,
  itemNumber
}, organisationId, client = pool) => {
  const text = fieldItems.update;
  const values = [id, name, itemNumber, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const remove = async (itemId, organisationId, client = pool) => {
  const text = fieldItems.remove;
  const values = [itemId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  update,
  remove
};
