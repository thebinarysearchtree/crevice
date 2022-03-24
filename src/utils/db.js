import pool from '../database/db.js';
import { makeReviver } from './data.js';

const reviver = makeReviver();

const wrap = (sql) => {
  return `
    with wrap_result as (${sql}) 
    select cast(coalesce(json_agg(wrap_result), json_build_array()) as text) as result 
    from wrap_result`;
}

const rowCount = async (sql, params, client = pool) => {
  const result = await client.query(sql, params);
  return result.rowCount;
}

const rows = async (sql, params, client = pool) => {
  const result = await client.query(wrap(sql), params);
  return JSON.parse(result.rows[0].result, reviver);
}

const first = async (sql, params, client = pool) => {
  const result = await client.query(wrap(sql), params);
  const parsed = JSON.parse(result.rows[0].result, reviver);
  return parsed.length === 0 ? null : parsed[0];
}

const value = async (sql, params, client = pool) => {
  const result = await client.query({
    text: sql, 
    values: params,
    rowMode: 'array'
  });
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
  rows,
  first,
  value,
  result,
  empty
};
