const { Pool } = require('pg');
const types = require('pg').types;

let pool = null;

const getPool = () => {
  if (!pool) {
    try {
      pool = new Pool({
        user: 'stampede',
        host: 'localhost',
        database: 'stampede',
        password: 'stampede'
      });
    }
    catch (e) {
      console.error(e);
    }
  }
  return pool;
}

module.exports = getPool;