import getPool from '../database/db.js';
import { sql, wrap } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  name,
  abbreviation,
  locationId,
  notes
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into areas(
      name,
      abbreviation,
      location_id,
      notes,
      organisation_id)
    select ${[name, abbreviation, locationId, notes, organisationId]}
    where exists(
      select 1 from locations
      where
        id = ${locationId} and
        organisation_id = ${organisationId})
    returning id`);
  return result.rows[0].id;
}

const update = async ({
  id,
  name,
  abbreviation,
  locationId,
  notes
}, organisationId, client = pool) => {
  await client.query(sql`
    update areas
    set
      name = ${name},
      abbreviation = ${abbreviation},
      location_id = ${locationId},
      notes = ${notes}
    where
      id = ${id} and
      organisation_id = ${organisationId} and
      exists(
        select 1 from locations
        where
          id = ${locationId} and
          organisation_id = ${organisationId}))`);
}

const getById = async (areaId, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select * from areas
    where 
      id = ${areaId} and 
      organisation_id = ${organisationId}`);
  return result.rows[0].result;
}

const getWithLocation = async (organisationId, client = pool) => {
  const result =  await client.query(wrap`
    select
      l.id,
      l.name,
      l.abbreviation,
      json_agg(json_build_object(
        'id', a.id,
        'name', a.name,
        'abbreviation', a.abbreviation,
        'time_zone', l.time_zone) order by a.abbreviation asc) as areas
    from
      areas a join
      locations l on a.location_id = l.id
    where a.organisation_id = ${organisationId}
    group by l.id
    order by l.name asc`);
  return result.rows[0].result;
}

const getSelectListItems = async (isAdmin, userId, organisationId, client = pool) => {
  if (isAdmin) {
    const result = await client.query(wrap`
      select 
        id, 
        abbreviation as name
      from areas 
      where organisation_id = ${organisationId}
      order by abbreviation desc`);
    return result.rows[0].result;
  }
  const result = await client.query(wrap`
    select 
      a.id, 
      a.abbreviation as name
    from
      user_areas ua join
      areas a on ua.area_id = a.id 
    where 
      ua.user_id = ${userId} and
      ua.organisation_id = ${organisationId} and
      ua.is_admin is true and
      ua.start_time <= now() and (ua.end_time > now() or ua.end_time is null)
    order by a.abbreviation desc`);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select
      a.*,
      l.abbreviation as location_name,
      coalesce(json_agg(json_build_object(
        'id', u.id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'image_id', u.image_id)) filter (where ua.is_admin is true), json_build_array()) as administrators,
      count(*) filter (where ua.user_id is not null) as active_user_count
    from 
      areas a join
      locations l on l.id = a.location_id left join
      user_areas ua on 
        a.id = ua.area_id and
        ua.start_time <= now() and
        (ua.end_time is null or ua.end_time > now()) left join
      users u on ua.user_id = u.id
    where a.organisation_id = ${organisationId}
    group by
      a.id,
      l.name,
      l.abbreviation
    order by
      l.name asc,
      a.name asc`);
  return result.rows[0].result;
}

const remove = async (areaId, organisationId, client = pool) => {
  await client.query(sql`
    delete from areas
    where
      id = ${areaId} and
      organisation_id = ${organisationId}`);
}

export default {
  insert,
  update,
  getById,
  getWithLocation,
  getSelectListItems,
  find,
  remove
};
