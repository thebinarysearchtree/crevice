import getPool from '../database/db.js';
import { sql, wrap } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  name, 
  colour,
  cancelBeforeMinutes,
  bookBeforeMinutes
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into roles(
      name,
      colour,
      cancel_before_minutes,
      book_before_minutes,
      organisation_id)
    values(${[
      name, 
      colour, 
      cancelBeforeMinutes, 
      bookBeforeMinutes, 
      organisationId
    ]})`);
  return result;
}

const update = async ({
  id, 
  name,
  colour,
  cancelBeforeMinutes,
  bookBeforeMinutes
 }, organisationId, client = pool) => {
  const result = await client.query(sql`
    update roles
    set 
      name = ${name},
      colour = ${colour},
      cancel_before_minutes = ${cancelBeforeMinutes},
      book_before_minutes = ${bookBeforeMinutes}
    where
      id = ${id} and
      organisation_id = ${organisationId}`);
  return result;
}

const getById = async (roleId, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select * from roles
    where 
      id = ${roleId} and 
      organisation_id = ${organisationId}`);
  return result.rows[0].result;
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select 
      id,
      name,
      colour
    from roles 
    where organisation_id = ${organisationId}
    order by name desc`);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select
      r.*,
      count(distinct ua.user_id) as user_count
    from 
      roles r left join
      user_areas ua on ua.role_id = r.id
    where r.organisation_id = ${organisationId}
    group by r.id
    order by r.name asc`);
  return result.rows[0].result;
}

const remove = async (roleId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from roles
    where
      id = ${roleId} and
      organisation_id = ${organisationId}`);
  return result;
}

export default {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
