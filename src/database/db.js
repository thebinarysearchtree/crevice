const pg = require('pg');
const { Pool } = pg;
const { database: config } = require('../../config');

let pool = null;

const getPool = () => {
  if (!pool) {
    try {
      pool = new Pool(config);
    }
    catch (e) {
      console.error(e);
    }
  }
  return pool;
}

module.exports = getPool;
