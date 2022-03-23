import pool from '../database/db.js';

const rowCount = async (sql, params, client = pool) => {
  const result = await client.query(sql, params);
  return result.rowCount;
}

const many = async (sql, params, client = pool) => {
  const result = await client.query(sql, params);
  return result.rows;
}

const first = async (sql, params, client = pool) => {
  const result = await client.query(sql, params);
  return result.rows.length === 0 ? null : result.rows[0];
}

const value = async (sql, params, client = pool) => {
  const result = await client.query(sql, params);
  return result.rows.length === 0 ? null : result.rows[0][0];
}

const result = async (sql, params, client = pool) => {
  const result = await client.query(sql, params);
  return result;
}

const empty = async (sql, params, client = pool) => {
  await client.query(sql, params);
}

export default {
  rowCount,
  many,
  first,
  value,
  result,
  empty
};
