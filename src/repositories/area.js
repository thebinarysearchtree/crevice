const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name,
  abbreviation,
  locationId,
  notes
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into areas(
      name,
      abbreviation,
      locationId,
      notes,
      organisationId)
    values($1, $2, $3, $4, $5)
    where exists(
      select 1 from locations
      where
        id = $3 and
        organisationId = $5))
    returning id`, [
      name,
      abbreviation,
      locationId,
      notes,
      organisationId]);
  return result.rows[0].id;
}

const update = async ({
  id,
  name,
  abbreviation,
  locationId,
  notes
}, organisationId, client = pool) => {
  await client.query(`
    update areas
    set
      name = $2,
      abbreviation = $3,
      locationId = $4,
      notes = $5
    where
      id = $1 and
      organisationId = $6 and
      exists(
        select 1 from locations
        where
          id = $4 and
          organisationId = $6))`, [
        id,
        name,
        abbreviation,
        locationId,
        notes,
        organisationId]);
}

const getById = async (areaId, organisationId, client = pool) => {
  const result = await client.query(`
    select
      name,
      abbreviation,
      locationId as "locationId",
      notes,
      createdAt as "createdAt"
    from areas
    where 
      id = $1 and 
      organisationId = $2`, [areaId, organisationId]);
  return result.rows[0];
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id, 
      abbreviation 
    from areas 
    where organisationId = $1
    order by abbreviation desc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      a.name,
      a.abbreviation,
      a.locationId as "locationId",
      l.name as "locationName",
      a.notes,
      a.createdAt as "createdAt",
      sum(case when u.userId is null then 0 else 1 end) as "activeUserCount"
    from 
      areas a join
      locations l on l.id = a.locationId left join
      userAreas u on a.id = u.areaId and 
      u.startTime <= now() and
      (u.endTime is null or u.endTime >= now())
    where
      a.organisationId = $1
    group by
      a.name,
      a.abbreviation,
      a.locationId,
      l.name,
      a.notes,
      a.createdAt,
      u.userId`, [organisationId]);
  return result.rows;
}

const remove = async (areaId, organisationId, client = pool) => {
  await client.query(`
    delete from areas
    where
      id = $1 and
      organisationId = $2`, [areaId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
