const getPool = require('../database/db');

const pool = getPool();

const insert = async (name, organisationId, client = pool) => {
  const result = await client.query(`
    insert into roles(
      name,
      organisation_id)
    values($1, $2)
    returning id`, [name, organisationId]);
  return result.rows[0].id;
}

const update = async (roleId, name, organisationId, client = pool) => {
  await client.query(`
    update roles
    set name = $2
    where
      id = $1 and
      organisation_id = $3`, [roleId, name, organisationId]);
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
      name 
    from roles 
    where organisation_id = $1
    order by name desc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      r.id,
      r.name,
      r.created_at as created_at,
      sum(case when u.user_id is null then 0 else 1 end) as "user_count"
    from 
      roles r left join
      user_roles u on r.id = u.role_id
    where
      r.organisation_id = $1
    group by
      r.id,
      u.user_id`, [organisationId]);
  return result.rows;
}

const remove = async (roleId, organisationId, client = pool) => {
  await client.query(`
    delete from roles
    where
      id = $1 and
      organisation_id = $2`, [roleId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
