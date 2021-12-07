import pg from 'pg';
import config from '../../config.js';

const { Pool } = pg;

let pool = null;

const getPool = () => {
  if (!pool) {
    try {
      pool = new Pool(config.database);
    }
    catch (e) {
      console.error(e);
    }
  }
  return pool;
}

getPool();

export default pool;
