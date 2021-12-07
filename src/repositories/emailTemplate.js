import pool from '../database/db.js';
import sql from '../../sql';

const { emailTemplates } = sql;

const insert = async ({
  type,
  name,
  subject,
  slate,
  html,
  plaintext,
  isDefault = false
}, organisationId, client = pool) => {
  const text = emailTemplates.insert;
  const values = [
    type, 
    name, 
    subject, 
    JSON.stringify(slate), 
    html, 
    plaintext, 
    isDefault, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  templateId,
  subject,
  slate,
  html,
  plaintext
}, organisationId, client = pool) => {
  const text = emailTemplates.update;
  const values = [
    templateId,
    subject, 
    JSON.stringify(slate), 
    html, 
    plaintext, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const getById = async (templateId, type, organisationId, client = pool) => {
  const text = emailTemplates.getById;
  const values = [templateId, type, organisationId];
  const result = await client.query(text, values);
  return JSON.parse(result.rows[0].result);
}

const getDefaultTemplate = async (type, organisationId, client = pool) => {
  const text = emailTemplates.getDefault;
  const values = [type, organisationId];
  const result = await client.query(text, values);
  return JSON.parse(result.rows[0].result);
}

const remove = async (templateId, organisationId, client = pool) => {
  const text = emailTemplates.remove;
  const values = [templateId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  getById,
  getDefaultTemplate,
  update,
  remove
};
