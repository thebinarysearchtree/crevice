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

class Client {
  constructor() {
    this.client = pool;
  }

  async connect() {
    this.client = await pool.connect();
  }

  async begin() {
    await this.client.query('begin');
  }

  async commit() {
    await this.client.query('commit');
  }

  async rollback() {
    await this.client.query('rollback');
  }

  release() {
    this.client.release();
  }

  async rowCount(sql, params) {
    const result = await this.client.query(sql, toValues(params));
    return result.rowCount;
  }

  async rows(sql, params) {
    const result = await this.client.query(wrap(sql), toValues(params));
    return JSON.parse(result.rows[0].result, reviver);
  }

  async text(sql, params) {
    const result = await this.client.query(wrap(sql), toValues(params));
    return result.rows[0].result;
  }

  async first(sql, params) {
    const result = await this.client.query(wrap(sql), toValues(params));
    const parsed = JSON.parse(result.rows[0].result, reviver);
    return parsed.length === 0 ? null : parsed[0];
  }

  async value(sql, params) {
    const result = await this.client.query({
      text: sql, 
      values: toValues(params),
      rowMode: 'array'
    });
    return result.rows.length === 0 ? null : result.rows[0][0];
  }

  async result(sql, params) {
    const result = await this.client.query(sql, toValues(params));
    return result;
  }

  async empty(sql, params) {
    await this.client.query(sql, toValues(params));
  }
}

const db = new Client();

export {
  pool,
  db,
  Client
};
