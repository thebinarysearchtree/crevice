const getPool = require('../database/db');
const { sql, wrap } = require('../utils/data');

const pool = getPool();

const insert = async ({
  name
}, client = pool) => {
  const result = await client.query(sql`
    insert into organisations(name)
    values(${name}) 
    returning id`);
  return result.rows[0].id;
}

const getById = async (id, client = pool) => {
  const result = await client.query(wrap`
    select name
    from organisations
    where id = ${id}`);
  return result.rows[0].result;
}

const update = async ({
  name,
  logoImageId
}, organisationId, client = pool) => {
  await client.query(`
    update organisations
    set 
      name = ${name},
      logo_image_id = ${logoImageId}
    where id = ${organisationId}`);
}

const deleteById = async (organisationId, client = pool) => {
  await client.query(sql`
    delete from organisations 
    where id = ${organisationId}`);
}

module.exports = {
  insert,
  getById,
  update,
  deleteById
};
