const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name
}, client = pool) => {
  const result = await client.query(`
    insert into organisations(name)
    values($1) 
    returning id`, [name]);
  return result.rows[0].id;
}

const getById = async (id, client = pool) => {
  const result = await client.query(`
    select name
    from organisations
    where id = $1`, [id]);
  return result.rows[0];
}

const update = async ({
  name
}, organisationId, client = pool) => {
  await client.query(`
    update organisations
    set name = $1
    where id = $2`, [
      name,
      organisationId]);
}

const deleteById = async (organisationId, client = pool) => {
  await client.query(`
    delete from organisations 
    where id = $1`, [organisationId]);
}

module.exports = {
  insert,
  getById,
  update,
  deleteById
};
