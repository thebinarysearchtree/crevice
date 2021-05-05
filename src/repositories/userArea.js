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
  if (endTime) {
    const start = new Date(startTime.year, startTime.month - 1, startTime.day);
    const end = new Date(endTime.year, endTime.month - 1, endTime.day);
    if (start.getTime() > end.getTime()) {
      throw new Error();
    }
  }
  const params = [userId, areaId, roleId, isAdmin, organisationId, startTime.year, startTime.month, startTime.day];
  const startTimeMaker = `make_timestamptz($6, $7, $8, 0, 0, 0, time_zone)`;
  const endTimeMaker = endTime ? `make_timestamptz($9, $10, $11, 0, 0, 0, time_zone) + interval '1 day'` : '$9';
  const where = endTime ? `start_time < ${endTimeMaker} and ` : '';
  if (endTime) {
    params.push(endTime.year);
    params.push(endTime.month);
    params.push(endTime.day);
  }
  else {
    params.push(null);
  }
  const result = await client.query(`
    with timezone_result as (
      select l.time_zone
      from
        areas a join
        locations l on a.location_id = l.id
      where a.id = $2)
    insert into user_areas(
      user_id,
      area_id,
      role_id,
      is_admin,
      organisation_id,
      start_time,
      end_time)
    select $1, $2, $3, $4, $5, ${startTimeMaker}, ${endTimeMaker}
    from timezone_result
    where 
      not exists(
        select 1 from user_areas
        where
          user_id = $1 and
          area_id = $2 and
          ${where}
          (end_time is null or end_time > ${startTimeMaker})) and
      exists(
        select 1 from areas
        where
          id = $2 and
          organisation_id = $5 and
          deleted_at is null) and
      exists(
        select 1 from roles
        where
          id = $3 and
          organisation_id = $5 and
          deleted_at is null)
    returning id`, params);
  if (result.rowCount !== 1) {
    throw new Error();
  }
  return result.rows[0].id;
}

const update = async ({
  id,
  userId,
  areaId,
  roleId,
  startTime,
  endTime,
  isAdmin
}, organisationId, client = pool) => {
  if (endTime) {
    const start = new Date(startTime.year, startTime.month - 1, startTime.day);
    const end = new Date(endTime.year, endTime.month - 1, endTime.day);
    if (start.getTime() > end.getTime()) {
      throw new Error();
    }
  }
  const params = [id, userId, areaId, roleId, isAdmin, organisationId, startTime.year, startTime.month, startTime.day];
  const startTimeMaker = `make_timestamptz($7, $8, $9, 0, 0, 0, tr.time_zone)`;
  const endTimeMaker = endTime ? `make_timestamptz($10, $11, $12, 0, 0, 0, tr.time_zone) + interval '1 day'` : '$10';
  const where = endTime ? `start_time < ${endTimeMaker} and ` : '';
  if (endTime) {
    params.push(endTime.year);
    params.push(endTime.month);
    params.push(endTime.day);
  }
  else {
    params.push(null);
  }
  const result = await client.query(`
    with timezone_result as (
      select l.time_zone
      from
        areas a join
        locations l on a.location_id = l.id
      where a.id = $2)
    update user_areas as a
    set
      role_id = $3,
      start_date = ${startTimeMaker},
      end_date = ${endTimeMaker},
      is_admin = $4
    from timezone_result tr
    where
      a.id = $1 and
      a.organisation_id = $6 and
      a.deleted_at is null and
      not exists(
        select 1 from user_areas
        where
          user_id = $2 and
          area_id = $3 and
          ${where}
          (end_time is null or end_time > ${startTimeMaker})) and
      exists(
        select 1 from areas
        where
          id = $3 and
          organisation_id = $6 and
          deleted_at is null) and
      exists(
        select 1 from roles
        where
          id = $4 and
          organisation_id = $6 and
          deleted_at is null)`, params);
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
      json_agg(json_build_object(
        'roleId', ua.role_id,
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
    group by a.id
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
