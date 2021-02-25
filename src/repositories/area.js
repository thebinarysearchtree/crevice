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
      location_id,
      notes,
      organisation_id)
    select $1, $2, $3, $4, $5
    where exists(
      select 1 from locations
      where
        id = $3 and
        organisation_id = $5)
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
      location_id = $4,
      notes = $5
    where
      id = $1 and
      organisation_id = $6 and
      exists(
        select 1 from locations
        where
          id = $4 and
          organisation_id = $6))`, [
        id,
        name,
        abbreviation,
        locationId,
        notes,
        organisationId]);
}

const getById = async (areaId, organisationId, client = pool) => {
  const result = await client.query(`
    select * from areas
    where 
      id = $1 and 
      organisation_id = $2`, [areaId, organisationId]);
  return result.rows[0];
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id, 
      abbreviation 
    from areas 
    where organisation_id = $1
    order by abbreviation desc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      a.*,
      l.abbreviation as location_name,
      sum(case when u.user_id is null then 0 else 1 end) as "active_user_count"
    from 
      areas a join
      locations l on l.id = a.location_id left join
      user_areas u on a.id = u.area_id and 
      u.start_time <= now() and
      (u.end_time is null or u.end_time >= now())
    where
      a.organisation_id = $1
    group by
      a.id,
      l.abbreviation,
      u.user_id
    order by
      l.abbreviation asc,
      a.abbreviation asc`, [organisationId]);
  return result.rows;
}

const remove = async (areaId, organisationId, client = pool) => {
  await client.query(`
    delete from areas
    where
      id = $1 and
      organisation_id = $2`, [areaId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
