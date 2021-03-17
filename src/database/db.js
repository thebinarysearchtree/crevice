const pg = require('pg');
const { Pool, types } = pg;
const { database: config } = require('../../config');

const handleRowDescription = pg.Query.prototype.handleRowDescription;

pg.Query.prototype.handleRowDescription = function(msg) {
  msg.fields.forEach(field => {
    const name = field.name.replace(/_[a-z]/g, (s) => s.substring(1).toUpperCase());
    field.name = name;
  });
  return handleRowDescription.call(this, msg);
}

let pool = null;

types.setTypeParser(20, (value) => parseInt(value, 10));

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
