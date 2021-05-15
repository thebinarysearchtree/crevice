const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  userId,
  areaId,
  roleId,
  startTime,
  endTime,
  isAdmin
}, organisationId, client = pool) => {
  const where1 = endTime ? 'cast($4 as timestamptz) < cast($5 as timestamptz) and ' : '';
  const where2 = endTime ? 'start_time < $5 and ' : '';
  const result = await client.query(`
    insert into user_areas(
      user_id,
      area_id,
      role_id,
      start_time,
      end_time,
      is_admin,
      organisation_id)
    select $1, $2, $3, $4, $5, $6, $7
    where
      ${where1}
      not exists(
        select 1 from user_areas
        where
          user_id = $1 and
          area_id = $2 and
          ${where2}
          (end_time is null or end_time > $5)
          and deleted_at is null) and
      exists(
        select 1 from areas
        where
          id = $2 and
          organisation_id = $7 and
          deleted_at is null) and
      exists(
        select 1 from roles
        where
          id = $3 and
          organisation_id = $7 and
          deleted_at is null)
    returning id`, [userId, areaId, roleId, startTime, endTime, isAdmin, organisationId]);
  if (result.rowCount !== 1) {
    throw new Error();
  }
  return result.rows[0].id;
}

const update = async ({
  id,
  userId,
  areaId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const where1 = endTime ? 'cast($4 as timestamptz) < cast($5 as timestamptz) and ' : '';
  const where2 = endTime ? 'start_time < $5 and ' : '';
  const result = await client.query(`
    update user_areas as a
    set
      area_id = $3,
      start_time = $4,
      end_time = $5
    where
      ${where1}
      id = $1 and
      organisation_id = $6 and
      deleted_at is null and
      not exists(
        select 1 from user_areas
        where
          user_id = $2 and
          area_id = $3 and
          ${where2}
          (end_time is null or end_time > $5)
          and deleted_at is null) and
      exists(
        select 1 from areas
        where
          id = $3 and
          organisation_id = $6 and
          deleted_at is null)`, [id, userId, areaId, startTime, endTime, organisationId]);
  if (result.rowCount !== 1) {
    throw new Error();
  }
}

const find = async (userId, organisationId, client = pool) => {
  const result = await client.query(`
    select 
      a.id,
      a.abbreviation, 
      a.name,
      l.time_zone,
      json_agg(json_build_object(
        'id', ua.id,
        'roleId', ua.role_id,
        'roleName', r.name,
        'roleColour', r.colour,
        'startTime', ua.start_time at time zone l.time_zone,
        'endTime', ua.end_time at time zone l.time_zone,
        'isAdmin', ua.is_admin) order by ua.start_time desc) as periods
    from 
      user_areas ua join
      roles r on ua.role_id = r.id join
      areas a on ua.area_id = a.id join
      locations l on a.location_id = l.id
    where
      ua.user_id = $1 and
      ua.organisation_id = $2 and
      ua.deleted_at is null and
      r.deleted_at is null and
      a.deleted_at is null
    group by a.id, l.time_zone
    order by abbreviation asc`, [userId, organisationId]);
  return result.rows;
}

const remove = async (userAreaId, organisationId, client = pool) => {
  await client.query(`
    update user_areas
    set deleted_at = now()
    where
      id = $1 and
      organisationId = $2 and
      deleted_at is not null`, [userAreaId, organisationId]);
}

module.exports = {
  insert,
  update,
  find,
  remove
};
