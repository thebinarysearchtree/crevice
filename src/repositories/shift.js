import getPool from '../database/db.js';
import { sql, wrap, makeReviver } from '../utils/data.js';

const reviver = makeReviver();

const pool = getPool();

const insert = async ({
  areaId,
  startTime,
  endTime,
  breakMinutes,
  seriesId
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into shifts(
      area_id,
      start_time,
      end_time,
      break_minutes,
      series_id,
      organisation_id)
    select ${[areaId, startTime, endTime, breakMinutes, seriesId, organisationId]}
    where 
      exists(
        select 1 from areas
        where
          id = ${areaId} and
          organisation_id = ${organisationId}) and
      exists(
        select 1 from shift_series
        where
          id = ${seriesId} and
          organisation_id = ${organisationId})
    returning id`);
  return result.rows[0].id;
}

const find = async ({
  areaId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  if (!areaId) {
    const areaResult = await client.query(wrap`
      select 
        a.id, 
        l.time_zone
      from
        areas a join
        locations l on a.location_id = l.id
      where a.organisation_id = ${organisationId}
      order by l.name asc, a.name asc
      limit 1`);
    const { id, timeZone } = JSON.parse(areaResult.rows[0].result, reviver)[0];
    areaId = id;
    startTime += timeZone;
    endTime += timeZone;
  }
  const shiftRolesQuery = sql`
    select
      sr.*,
      s.id as shift_id,
      r.name as role_name,
      r.colour as role_colour,
      count(*) filter (where b.id is not null) as booked_count,
      coalesce(json_agg(json_build_object(
        'id', b.user_id,
        'booking_id', b.id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'image_id', u.image_id)) filter (where b.id is not null), json_build_array()) as booked_users
    from
      shift_series ss join
      shifts s on s.series_id = ss.id join
      shift_roles sr on sr.series_id = ss.id join
      roles r on sr.role_id = r.id left join
      bookings b on b.shift_id = s.id and b.shift_role_id = sr.id left join
      users u on b.user_id = u.id
    where
      s.area_id = ${areaId} and
      s.start_time >= ${startTime} and
      s.start_time < ${endTime} and
      s.organisation_id = ${organisationId}
    group by s.id, sr.id, r.name, r.colour`;

  const shiftsQuery = sql`
    select
      s.id,
      s.start_time at time zone l.time_zone as start_time,
      s.end_time at time zone l.time_zone as end_time,
      s.break_minutes,
      to_char(coalesce(s.end_time - s.start_time, interval '0 hours'), 'HH24:MI') as duration,
      ss.notes,
      s.series_id,
      json_agg(sr) as shift_roles,
      sum(sr.capacity) as capacity,
      sum(sr.booked_count) as booked
    from
      shift_series ss join
      shifts s on s.series_id = ss.id join
      (${shiftRolesQuery}) as sr on sr.shift_id = s.id join
      areas a on s.area_id = a.id join
      locations l on a.location_id = l.id
    group by s.id, ss.id, l.time_zone
    order by s.start_time asc`;
  const result = await client.query(wrap`
    select
      cast(${areaId} as integer) as area_id,
      coalesce(json_agg(s), json_build_array()) as shifts
    from
      (${shiftsQuery}) as s`);
  return result.rows[0].result;
}

const getAvailableShifts = async ({
  userId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const availableQuery = sql`
    select sr.id, s.id as shift_id
    from
      user_areas ua left join
      shifts s on s.area_id = ua.area_id left join
      shift_series ss on s.series_id = ss.id left join
      shift_roles sr on sr.series_id = ss.id and sr.role_id = ua.role_id left join
      bookings b on b.shift_id = s.id and b.shift_role_id = sr.id
    where
      ua.user_id = ${userId} and
      ua.start_time <= now() and (ua.end_time is null or ua.end_time > now()) and
      s.start_time >= now() - (interval '1 minute' * s.break_minutes) and
      s.start_time < ${endTime} and
      ua.organisation_id = ${organisationId}
    group by s.id, sr.id
    having sr.capacity > count(*) filter (where b.id is not null)`;

  const bookedQuery = sql`
    select sr.id, s.id as shift_id
    from
      shift_series ss join
      shifts s on s.series_id = ss.id join
      shift_roles sr on sr.series_id = ss.id join
      bookings b on b.shift_id = s.id and b.shift_role_id = sr.id
    where
      b.user_id = ${userId} and
      s.start_time >= ${startTime} and
      s.start_time < ${endTime}`;

  const shiftRolesQuery = sql`
    select
      sr.*,
      s.id as shift_id,
      r.name,
      sr.can_book_and_cancel and (s.start_time - interval '1 minute' * sr.book_before_minutes > now()) as can_book,
      sr.can_book_and_cancel and (s.start_time - interval '1 minute' * sr.cancel_before_minutes > now()) as can_cancel,
      coalesce(bool_or(b.user_id = ${userId}), false) as booked,
      coalesce(json_agg(json_build_object(
        'id', b.user_id,
        'booking_id', b.id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'image_id', u.image_id) order by u.last_name asc) filter (where b.id is not null), json_build_array()) as booked_users
    from
      shift_series ss join
      shifts s on s.series_id = ss.id join
      shift_roles sr on sr.series_id = ss.id join
      roles r on sr.role_id = r.id left join
      bookings b on b.shift_id = s.id and b.shift_role_id = sr.id left join
      users u on b.user_id = u.id
    group by s.id, sr.id, s.start_time, r.name`;

  const result = await client.query(wrap`
    select
      s.id,
      s.area_id,
      a.name as area_name,
      s.start_time at time zone l.time_zone as start_time,
      s.end_time at time zone l.time_zone as end_time,
      s.break_minutes,
      to_char(coalesce(s.end_time - s.start_time, interval '0 hours'), 'HH24:MI') as duration,
      ss.notes,
      s.series_id,
      json_agg(sr) as shift_roles,
      coalesce(bool_or(sr.booked), false) as booked,
      b.id as shift_role_id
    from
      shift_series ss join
      shifts s on s.series_id = ss.id join
      (${shiftRolesQuery}) as sr on sr.shift_id = s.id join
      areas a on s.area_id = a.id join
      locations l on a.location_id = l.id join
      ((${availableQuery}) union (${bookedQuery})) as b on s.id = b.shift_id
    group by s.id, ss.id, a.name, l.time_zone, b.id
    order by s.start_time asc`);
  return result.rows[0].result;
}

const remove = async (shiftId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from shifts
    where
      id = ${shiftId} and
      organisation_id = ${organisationId}`);
  return result;
}

export default {
  insert,
  find,
  getAvailableShifts,
  remove
};
