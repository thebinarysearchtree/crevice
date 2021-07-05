const getPool = require('../database/db');
const { sql, wrap } = require('../utils/data');

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
  const shiftRolesQuery = sql`
    select
      sr.*,
      count(*) filter (where b.id is not null) as booked_count,
      coalesce(json_agg(json_build_object(
        'user_id', b.user_id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'image_id', u.image_id)) filter (where b.id is not null), json_build_array()) as booked_users
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
    group by sr.id`;

  const result = await client.query(wrap`
    select
      s.id,
      s.start_time at time zone l.time_zone as start_time,
      s.end_time at time zone l.time_zone as end_time,
      s.break_minutes,
      to_char(coalesce(s.end_time - s.start_time, interval '0 hours'), 'HH24:MI') as duration,
      s.notes,
      s.series_id,
      json_agg(sr) as shift_roles,
      sum(sr.capacity) as capacity,
      sum(sr.booked_count) as booked
    from
      shifts s join
      (${shiftRolesQuery}) as sr on sr.shift_id = s.id join
      areas a on s.area_id = a.id join
      locations l on a.location_id = l.id
    group by s.id, l.time_zone
    order by s.start_time asc`);
  return result.rows[0].result;
}

const getAvailableShifts = async ({
  userId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const availableQuery = sql`
    select sr.id, sr.shift_id
    from
      user_areas ua left join
      shifts s on s.area_id = ua.area_id left join
      shift_roles sr on sr.shift_id = s.id and sr.role_id = ua.role_id left join
      bookings b on b.shift_role_id = sr.id
    where
      ua.user_id = ${userId} and
      ua.start_time <= now() and (ua.end_time is null or ua.end_time > now()) and
      s.start_time >= now() - (interval '1 minute' * s.break_minutes) and
      s.start_time < ${endTime} and
      ua.organisation_id = ${organisationId}
    group by sr.id
    having sr.capacity > count(*) filter (where b.id is not null)`;

  const bookedQuery = sql`
    select sr.id, sr.shift_id
    from
      bookings b join
      shift_roles sr on b.shift_role_id = sr.id join
      shifts s on sr.shift_id = s.id
    where
      b.user_id = ${userId} and
      s.start_time >= ${startTime} and
      s.start_time < ${endTime}`;

  const shiftRolesQuery = sql`
    select
      sr.*,
      coalesce(bool_or(b.user_id = ${userId}), false) as booked,
      coalesce(json_agg(json_build_object(
        'user_id', b.user_id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'image_id', u.image_id) order by u.last_name asc) filter (where b.id is not null), json_build_array()) as booked_users
    from
      shifts s join
      shift_roles sr on sr.shift_id = s.id left join
      bookings b on b.shift_role_id = sr.id left join
      users u on b.user_id = u.id
    group by sr.id`;

  const result = await client.query(wrap`
    select
      s.id,
      s.area_id,
      a.abbreviation as area_name,
      s.start_time at time zone l.time_zone as start_time,
      s.end_time at time zone l.time_zone as end_time,
      s.break_minutes,
      to_char(coalesce(s.end_time - s.start_time, interval '0 hours'), 'HH24:MI') as duration,
      s.notes,
      s.series_id,
      json_agg(sr) as shift_roles,
      coalesce(bool_or(sr.booked), false) as booked,
      b.id as shift_role_id
    from
      shifts s join
      (${shiftRolesQuery}) as sr on sr.shift_id = s.id join
      areas a on s.area_id = a.id join
      locations l on a.location_id = l.id join
      ((${availableQuery}) union (${bookedQuery})) as b on s.id = b.shift_id
    group by s.id, a.abbreviation, l.time_zone, b.id
    order by s.start_time asc`);
  return result.rows[0].result;
}

module.exports = {
  insert,
  find,
  getAvailableShifts
};
