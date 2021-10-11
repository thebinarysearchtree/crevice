import getPool from '../database/db.js';
import { sql, wrap } from '../utils/data.js';

const pool = getPool();

const insert = async (userId, followingId, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into followers(
      user_id,
      following_user_id,
      organisation_id)
    values(${[userId, followingId, organisationId]})`);
  return result;
}

const find = async ({
  userId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select
      u.id,
      concat_ws(' ', u.first_name, u.last_name) as name,
      u.image_id,
      case when s.id is null then null else json_build_object(
        'id', s.id,
        'area_name', a.name,
        'role_name', r.name,
        'role_colour', r.colour,
        'start_time', s.start_time,
        'end_time', s.end_time) end as shift,
      fn.notes
    from
      followers f join
      users u on f.following_user_id = u.id left join
      bookings b on u.id = b.user_id left join
      shifts s on 
        b.shift_id = s.id and 
        s.start_time < ${endTime} and 
        s.start_time >= ${startTime} left join
      areas a on s.area_id = a.id left join
      shift_roles sr on b.shift_role_id = sr.id left join
      roles r on sr.role_id = r.id left join
      follower_notes fn on u.id = fn.created_by and b.id = fn.booking_id
    where
      f.user_id = ${userId} and
      f.organisation_id = ${organisationId}
    order by u.last_name, u.id asc`);
  return result.rows[0].result;
}

const remove = async (userId, followingId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from followers
    where
      user_id = ${userId} and
      following_user_id = ${followingId} and
      organisation_id = ${organisationId}`);
  return result;
}

export default {
  insert,
  find,
  remove
};
