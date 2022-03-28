import pg from 'pg';
import config from '../../config.js';
import { makeReviver } from '../utils/data.js';

const reviver = makeReviver();

const { Pool } = pg;

let pool = null;

try {
  pool = new Pool(config.database);
}
catch (e) {
  console.error(e);
}

const wrap = (sql) => {
  return `
    with wrap_result as (${sql}) 
    select cast(coalesce(json_agg(wrap_result), json_build_array()) as text) as result 
    from wrap_result`;
}

const toValues = (params) => {
  if (params === undefined) {
    return null;
  }
  if (typeof params === 'string' || typeof params === 'number' || typeof params === 'boolean' || params instanceof Date || typeof params === 'bigint' || params === null) {
    return [params];
  }
  return Object.values(params);
}

const rowCount = async (sql, params, client = pool) => {
  const result = await client.query(sql, toValues(params));
  return result.rowCount;
}

const rows = async (sql, params, client = pool) => {
  const result = await client.query(wrap(sql), toValues(params));
  return JSON.parse(result.rows[0].result, reviver);
}

const text = async (sql, params, client = pool) => {
  const result = await client.query(wrap(sql), toValues(params));
  return result.rows[0].result;
}

const first = async (sql, params, client = pool) => {
  const result = await client.query(wrap(sql), toValues(params));
  const parsed = JSON.parse(result.rows[0].result, reviver);
  return parsed.length === 0 ? null : parsed[0];
}

const value = async (sql, params, client = pool) => {
  const result = await client.query({
    text: sql, 
    values: toValues(params),
    rowMode: 'array'
  });
  return result.rows.length === 0 ? null : result.rows[0][0];
}

const result = async (sql, params, client = pool) => {
  const result = await client.query(sql, toValues(params));
  return result;
}

const empty = async (sql, params, client = pool) => {
  await client.query(sql, toValues(params));
}

const db = {
  rowCount,
  rows,
  text,
  first,
  value,
  result,
  empty
};

export {
  pool,
  db
};
