import pool from '../database/db.js';
import sql from '../../sql';

const insert = async ({
  userId,
  areaId,
  roleId,
  startTime,
  endTime,
  isAdmin
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into user_areas(
      user_id,
      area_id,
      role_id,
      start_time,
      end_time,
      is_admin,
      organisation_id)
    select ${[userId, areaId, roleId, startTime, endTime, isAdmin, organisationId]}
    where
      ${endTime ? sql`cast(${startTime} as timestamptz) < cast(${endTime} as timestamptz) and ` : sql``}
      not exists(
        select 1 from user_areas
        where
          user_id = $1 and
          area_id = $2 and
          ${endTime ? sql`start_time < ${endTime} and ` : sql``}
          (end_time is null or end_time > ${endTime})) and
      exists(
        select 1 from areas
        where
          id = ${areaId} and
          organisation_id = ${organisationId}) and
      exists(
        select 1 from roles
        where
          id = ${roleId} and
          organisation_id = ${organisationId})
    returning id`);
  return result;
}

const update = async ({
  id,
  userId,
  areaId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    update user_areas as a
    set
      area_id = ${areaId},
      start_time = ${startTime},
      end_time = ${endTime}
    where
    ${endTime ? sql`cast(${startTime} as timestamptz) < cast(${endTime} as timestamptz) and ` : sql``}
      id = ${id} and
      organisation_id = ${organisationId} and
      not exists(
        select 1 from user_areas
        where
          id != ${id} and
          user_id = ${userId} and
          area_id = ${areaId} and
          ${endTime ? sql`start_time < ${endTime} and ` : sql``}
          (end_time is null or end_time > ${endTime})) and
      exists(
        select 1 from user_areas
        where
          id = ${id} and
          user_id = ${userId}) and
      exists(
        select 1 from areas
        where
          id = ${areaId} and
          organisation_id = ${organisationId})`);
  return result;
}

const find = async (userId, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select 
      a.id,
      a.name,
      l.time_zone,
      json_agg(json_build_object(
        'id', ua.id,
        'role_id', ua.role_id,
        'role_name', r.name,
        'role_colour', r.colour,
        'start_time', ua.start_time at time zone l.time_zone,
        'end_time', ua.end_time at time zone l.time_zone,
        'is_admin', ua.is_admin) order by ua.start_time asc) as periods
    from 
      user_areas ua join
      roles r on ua.role_id = r.id join
      areas a on ua.area_id = a.id join
      locations l on a.location_id = l.id
    where
      ua.user_id = ${userId} and
      ua.organisation_id = ${organisationId}
    group by a.id, l.time_zone
    order by name asc`);
  return result.rows[0].result;
}

const remove = async (userAreaId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from user_areas
    where
      id = ${userAreaId} and
      organisation_id = ${organisationId}`);
  return result;
}

export default {
  insert,
  update,
  find,
  remove
};
