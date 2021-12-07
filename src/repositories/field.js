import pool from '../database/db.js';
import { makeReviver } from '../utils/data.js';
import sql from '../../sql';

const { fields } = sql;

const reviver = makeReviver();

const insert = async ({
  name,
  fieldType
}, organisationId, client = pool) => {
  const text = fields.insert;
  const values = [name, fieldType, organisationId];
  const result = await client.query(text, values);
  return { 
    fieldId: result.rows[0].id, 
    rowCount: result.rowCount 
  };
}

const update = async (fieldId, name, organisationId, client = pool) => {
  const text = fields.update;
  const values = [fieldId, name, fieldType, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const moveUp = async (fieldId, organisationId, client = pool) => {
  const text = fields.moveUp;
  const values = [fieldId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const getById = async (fieldId, organisationId, client = pool) => {
  const text = fields.getById;
  const values = [fieldId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getFilenameFields = async (organisationId, client = pool) => {
  const fieldTypes = ['Short', 'Standard', 'Number'];
  const text = fields.getByType;
  const values = [fieldTypes, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getCsvFields = async (organisationId, client = pool) => {
  const fieldTypes = ['Short', 'Standard', 'Number', 'Select'];
  const text = fields.getByType;
  const values = [fieldTypes, organisationId];
  const result = await client.query(text, values);
  return JSON.parse(result.rows[0].result, reviver);
}

const getAllFields = async (organisationId, client = pool) => {
  const text = fields.getAllFields;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getSelectListItems = async (organisationId, client = pool) => {
  const text = fields.getItems;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const text = fields.find;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const remove = async (fieldId, organisationId, client = pool) => {
  const text = fields.remove;
  const values = [fieldId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  update,
  moveUp,
  getById,
  getFilenameFields,
  getCsvFields,
  getAllFields,
  getSelectListItems,
  find,
  remove
};
