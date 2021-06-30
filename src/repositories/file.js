const getPool = require('../database/db');
const { sql, wrap, makeReviver } = require('../utils/data');

const reviver = makeReviver();

const pool = getPool();

const insert = async ({
  fileId,
  filename,
  originalName,
  sizeBytes,
  mimeType
}, userId, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into files(
      id,
      filename,
      original_name,
      size_bytes,
      mime_type,
      uploaded_by,
      organisation_id)
    values(${[
      fileId, 
      filename, 
      originalName, 
      sizeBytes, 
      mimeType, 
      userId, 
      organisationId]})`);
  return result;
}

const getById = async (fileId, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select * from files
    where
      id = ${fileId} and
      organisation_id = ${organisationId}`, [fileId, organisationId]);
  return JSON.parse(result.rows[0].result, reviver)[0];
}

module.exports = {
  insert,
  getById
};
