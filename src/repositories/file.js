const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  fileId,
  filename,
  originalName,
  sizeBytes,
  mimeType
}, userId, organisationId, client = pool) => {
  const result = await client.query(`
    insert into files(
      id,
      filename,
      original_name,
      size_bytes,
      mime_type,
      uploaded_by,
      organisation_id)
    values($1, $2, $3, $4, $5, $6, $7)`, [
      fileId, 
      filename, 
      originalName, 
      sizeBytes, 
      mimeType, 
      userId, 
      organisationId]);
  return result;
}

const getById = async (fileId, organisationId, client = pool) => {
  const result = await client.query(`
    select * from files
    where
      id = $1 and
      organisation_id = $2`, [fileId, organisationId]);
  return result.rows[0];
}

module.exports = {
  insert,
  getById
};
