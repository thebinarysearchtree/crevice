import getPool from '../database/db.js';
import { sql, wrap } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  name,
  timeZone,
  address
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into locations(
      name,
      time_zone,
      address,
      organisation_id)
    values(${[
      name,
      timeZone,
      address,
      organisationId]})`);
  return result;
}

const update = async ({
  id,
  name,
  timeZone,
  address
}, organisationId, client = pool) => {
  const result = await client.query(`
    update locations
    set
      name = ${name},
      time_zone = ${timeZone},
      address = ${address}
    where
      id = ${id} and
      organisation_id = ${organisationId}`);
  return result;
}

const getById = async (locationId, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select * from locations
    where 
      id = ${locationId} and 
      organisation_id = ${organisationId}`);
  return result.rows[0].result;
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select 
      id,
      name
    from locations 
    where organisation_id = ${organisationId}
    order by name asc`);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select
      l.*,
      count(*) filter (where a.id is not null) as area_count
    from 
      locations l left join
      areas a on l.id = a.location_id
    where l.organisation_id = ${organisationId}
    group by l.id
    order by l.name asc`);
  return result.rows[0].result;
}

const remove = async (locationId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from locations
    where
      id = ${locationId} and
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
