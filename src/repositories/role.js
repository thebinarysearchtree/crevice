import pool from '../database/db.js';
import sql from '../../sql';

const { roles } = sql;

const insert = async ({
  name, 
  colour,
  cancelBeforeMinutes,
  bookBeforeMinutes
}, organisationId, client = pool) => {
  const text = roles.insert;
  const values = [
    name, 
    colour, 
    cancelBeforeMinutes, 
    bookBeforeMinutes, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  id, 
  name,
  colour,
  cancelBeforeMinutes,
  bookBeforeMinutes
 }, organisationId, client = pool) => {
  const text = roles.update;
  const values = [
    id,
    name, 
    colour, 
    cancelBeforeMinutes, 
    bookBeforeMinutes, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const getById = async (roleId, organisationId, client = pool) => {
  const text = roles.getById;
  const values = [roleId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getSelectListItems = async (organisationId, client = pool) => {
  const text = roles.getItems;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const text = roles.find;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const remove = async (roleId, organisationId, client = pool) => {
  const text = roles.remove;
  const values = [roleId, organisationId];
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
