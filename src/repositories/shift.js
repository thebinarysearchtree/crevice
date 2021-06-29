const getPool = require('../database/db');
const { sql, wrap, subquery } = require('../utils/data');

const pool = getPool();

const insert = async ({
  areaId,
  startTime,
  endTime,
  breakMinutes,
  notes,
  seriesId
}, userId, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into shifts(
      area_id,
      start_time,
      end_time,
      break_minutes,
      notes,
      created_by,
      requires_approval,
      series_id,
      organisation_id)
    select ${[areaId, startTime, endTime, breakMinutes, notes, userId, false, seriesId, organisationId]}
    where exists(
      select 1 from areas
      where
        id = ${areaId} and
        organisation_id = ${organisationId})
    returning id`);
  return result.rows[0].id;
}

const find = async ({
  areaId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    with role_result as (
      select
        sr.shift_id,
        sr.role_id,
        sr.capacity,
        count(*) filter (where b.id is not null) as booked_count,
        json_agg(json_build_object(
          'user_id', b.user_id,
          'name', concat_ws(' ', u.first_name, u.last_name),
          'image_id', u.image_id)) filter (where b.id is not null) as booked_users
      from
        shifts s join
        shift_roles sr on sr.shift_id = s.id left join
        bookings b on b.shift_role_id = sr.id left join
        users u on b.user_id = u.id
      where
        s.area_id = ${areaId} and
        s.start_time >= ${startTime} and
        s.start_time < ${endTime} and
        s.organisation_id = ${organisationId}
      group by sr.id)
    ${subquery`
      select
        s.id,
        s.start_time at time zone l.time_zone as start_time,
        s.end_time at time zone l.time_zone as end_time,
        json_agg(sr) as shift_roles,
        sum(sr.capacity) as capacity,
        sum(sr.booked_count) as booked
      from
        shifts s join
        role_result sr on sr.shift_id = s.id join
        areas a on s.area_id = a.id join
        locations l on a.location_id = l.id
      group by s.id, l.time_zone
      order by s.start_time asc`}`);
  return result.rows[0].result;
}

const getAvailableShifts = async ({
  userId,
  endTime
}, organisationId, client = pool) => {
  const result = await client.query(`
    select
      s.id,
      s.area_id,
      a.abbreviation,
      s.start_time at time zone l.time_zone as start_time,
      s.end_time at time zone l.time_zone as end_time,
      s.break_minutes,
      sr.capacity,
      count(*) filter (where b.id is not null) as booked_count,
      json_agg(json_build_object(
        'id', b.user_id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'image_id', u.image_id,
        'assigned_to', b.assigned_to)) as booked_users
    from
      user_areas ua join
      users u on ua.user_id = u.id join
      areas a on ua.area_id = a.id join 
      locations l on a.location_id = l.id left join
      shifts s on s.area_id = a.id left join
      shift_roles sr on sr.shift_id = s.id and sr.role_id = ua.role_id left join
      bookings b on b.shift_role_id = sr.id
    where
      ua.user_id = $1 and
      s.start_time >= now() - (interval '1 minute' * s.book_before_minutes) and
      s.start_time < $2
    group by sr.id
    having sr.capacity > count(*) filter (where b.id is not null)
    order by s.start_time asc`);
}

module.exports = {
  insert,
  find
};
