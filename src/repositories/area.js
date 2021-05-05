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
      deleted_at is null and
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

const getWithLocation = async (organisationId, client = pool) => {
  const result =  await client.query(`
    select
      l.name,
      json_agg(json_build_object(
        'id', a.id,
        'name', a.name,
        'abbreviation', a.abbreviation) order by a.abbreviation asc) as areas
    from
      areas a join
      locations l on a.location_id = l.id
    where
      a.organisation_id = $1 and
      a.deleted_at is null
    group by l.id
    order by l.name asc`, [organisationId]);
  return result.rows;
}

const getSelectListItems = async (isAdmin, userId, organisationId, client = pool) => {
  if (isAdmin) {
    const result = await client.query(`
      select 
        id, 
        abbreviation as name
      from areas 
      where 
        organisation_id = $1 and
        deleted_at is null
      order by abbreviation desc`, [organisationId]);
    return result.rows;
  }
  const result = await client.query(`
    select 
      a.id, 
      a.abbreviation as name
    from
      user_areas ua join
      areas a on ua.area_id = a.id 
    where 
      ua.user_id = $1 and
      ua.organisation_id = $2 and
      ua.is_admin is true and
      ua.start_time <= now() and (ua.end_time > now() or ua.end_time is null) and
      a.deleted_at is null
    order by a.abbreviation desc`, [userId, organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      a.*,
      l.abbreviation as location_name,
      coalesce(json_agg(json_build_object(
        'id', u.id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'imageId', u.image_id)) filter (where ua.is_admin is true), json_build_array()) as administrators,
      count(*) filter (where ua.user_id is not null) as active_user_count
    from 
      areas a join
      locations l on l.id = a.location_id left join
      user_areas ua on 
        a.id = ua.area_id and
        ua.start_time <= now() and
        (ua.end_time is null or ua.end_time > now()) left join
      users u on 
        ua.user_id = u.id and 
        u.deleted_at is null
    where
      a.organisation_id = $1 and
      a.deleted_at is null
    group by
      a.id,
      l.name,
      l.abbreviation
    order by
      l.name asc,
      a.name asc`, [organisationId]);
  return result.rows;
}

const remove = async (areaId, organisationId, client = pool) => {
  await client.query(`
    update areas
    set deleted_at = now()
    where
      id = $1 and
      organisation_id = $2 and
      deleted_at is null`, [areaId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getWithLocation,
  getSelectListItems,
  find,
  remove
};
