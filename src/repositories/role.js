const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name, 
  colour 
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into roles(
      name,
      colour,
      organisation_id)
    values($1, $2, $3)
    returning id`, [name, colour, organisationId]);
  return result.rows[0].id;
}

const update = async ({
  id, 
  name,
  colour
 }, organisationId, client = pool) => {
  await client.query(`
    update roles
    set 
      name = $2,
      colour = $3
    where
      id = $1 and
      organisation_id = $4 and
      deleted_at is null`, [id, name, colour, organisationId]);
}

const getById = async (roleId, organisationId, client = pool) => {
  const result = await client.query(`
    select * from roles
    where 
      id = $1 and 
      organisation_id = $2`, [roleId, organisationId]);
  return result.rows[0];
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id,
      name,
      colour
    from roles 
    where 
      organisation_id = $1 and
      deleted_at is null
    order by name desc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      r.*,
      count(distinct ua.user_id) as user_count
    from 
      roles r left join
      user_areas ua on ua.role_id = r.id
    where r.organisation_id = $1
    group by r.id
    order by r.name asc`, [organisationId]);
  return result.rows;
}

const remove = async (roleId, organisationId, client = pool) => {
  await client.query(`
    update roles
    set deleted_at = now()
    where
      id = $1 and
      organisation_id = $2 and
      deleted_at is null`, [roleId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
