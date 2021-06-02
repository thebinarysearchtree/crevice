const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name,
  abbreviation,
  timeZone,
  address
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into locations(
      name,
      abbreviation,
      time_zone,
      address,
      organisation_id)
    values($1, $2, $3, $4, $5)
    returning id`, [
      name,
      abbreviation,
      timeZone,
      address,
      organisationId]);
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
      name = $2,
      abbreviation = $3,
      time_zone = $4,
      address = $5
    where
      id = $1 and
      organisation_id = $6`, [
        id,
        name,
        abbreviation,
        timeZone,
        address,
        organisationId]);
}

const getById = async (locationId, organisationId, client = pool) => {
  const result = await client.query(`
    select * from locations
    where 
      id = $1 and 
      organisation_id = $2`, [locationId, organisationId]);
  return result.rows[0];
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id,
      abbreviation as name
    from locations 
    where organisation_id = $1
    order by abbreviation asc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      l.*,
      count(*) filter (where a.id is not null) as area_count
    from 
      locations l left join
      areas a on l.id = a.location_id
    where l.organisation_id = $1
    group by l.id
    order by l.name asc`, [organisationId]);
  return result.rows;
}

const remove = async (locationId, organisationId) => {
  await client.query(`
    delete from locations
    where
      id = $1 and
      organisation_id = $2`, [locationId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
