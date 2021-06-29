const getPool = require('../database/db');
const { sql, wrap } = require('../utils/data');

const pool = getPool();

const insert = async ({
  name,
  abbreviation,
  timeZone,
  address
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into locations(
      name,
      abbreviation,
      time_zone,
      address,
      organisation_id)
    values(${[
      name,
      abbreviation,
      timeZone,
      address,
      organisationId]})
    returning id`);
  return result.rows[0].id;
}

const update = async ({
  id,
  name,
  abbreviation,
  timeZone,
  address
}, organisationId, client = pool) => {
  await client.query(`
    update locations
    set
      name = ${name},
      abbreviation = ${abbreviation},
      time_zone = ${timeZone},
      address = ${address}
    where
      id = ${id} and
      organisation_id = ${organisationId}`);
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
      abbreviation as name
    from locations 
    where organisation_id = ${organisationId}
    order by abbreviation asc`);
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

const remove = async (locationId, organisationId) => {
  await client.query(sql`
    delete from locations
    where
      id = ${locationId} and
      organisation_id = ${organisationId}`);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
