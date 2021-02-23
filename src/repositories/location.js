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
      timeZone,
      address,
      organisationId)
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
      timeZone = $4,
      address = $5
    where
      id = $1 and
      organisationId = $6`, [
        id,
        name,
        abbreviation,
        timeZone,
        address,
        organisationId]);
}

const getById = async (locationId, organisationId, client = pool) => {
  const result = await client.query(`
    select
      name,
      abbreviation,
      timeZone as "timeZone",
      address,
      createdAt as "createdAt"
    from locations
    where 
      id = $1 and 
      organisationId = $2`, [locationId, organisationId]);
  return result.rows[0];
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id,
      abbreviation as "name"
    from locations 
    where organisationId = $1
    order by abbreviation asc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      l.id,
      l.name,
      l.abbreviation,
      l.timeZone as "timeZone",
      l.address,
      l.createdAt as "createdAt",
      sum(case when a.id is null then 0 else 1 end) as "areaCount"
    from 
      locations l left join
      areas a on l.id = a.locationId
    where
      l.organisationId = $1
    group by
      l.id,
      l.name,
      l.abbreviation,
      l.timeZone,
      l.address,
      l.createdAt,
      l.id`, [organisationId]);
  return result.rows;
}

const remove = async (locationId, organisationId, client = pool) => {
  await client.query(`
    delete from locations
    where
      id = $1 and
      organisationId = $2`, [locationId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
