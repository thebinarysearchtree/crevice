import pool from '../database/db.js';
import { makeReviver } from '../utils/data.js';
import sql from '../../sql';

const { files } = sql;

const reviver = makeReviver();

const insert = async ({
  fileId,
  filename,
  originalName,
  sizeBytes,
  mimeType
}, userId, organisationId, client = pool) => {
  const text = files.insert;
  const values = [
    fileId, 
    filename, 
    originalName, 
    sizeBytes, 
    mimeType, 
    userId, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const getById = async (fileId, organisationId, client = pool) => {
  const text = files.getById;
  const values = [fileId, organisationId];
  const result = await client.query(text, values);
  return JSON.parse(result.rows[0].result, reviver)[0];
}

export default {
  insert,
  getById
};
