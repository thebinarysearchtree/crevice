import getPool from '../database/db.js';
import { sql } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  userId,
  shiftRoleId
}, bookedById, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into bookings(
      shift_role_id,
      user_id,
      booked_by,
      organisation_id)
    select ${[
      shiftRoleId,
      userId,
      bookedById,
      organisationId
    ]}
    where
      exists(
        select count(*) filter (where b.id is not null) < sr.capacity
        from
          shift_roles sr left join
          bookings b on b.shift_role_id = sr.id
        where sr.id = ${shiftRoleId}
        group by sr.id) and
      exists(
        select 1
        from
          shifts s join
          shift_roles sr on sr.shift_id = s.id join
          user_areas ua on ua.area_id = s.area_id and ua.role_id = sr.role_id
        where
          sr.id = ${shiftRoleId} and
          sr.organisation_id = ${organisationId} and
          ua.user_id = ${userId} and
          s.start_time >= ua.start_time and
          (ua.end_time is null or s.end_time < ua.end_time) and
          s.start_time - interval '1 minute' * sr.book_before_minutes > now()) and
      not exists(
        select 1
        from
          shifts s join
          shift_roles sr on sr.shift_id = s.id join
          bookings b on b.shift_role_id = sr.id join
          (
            select s.start_time, s.end_time
            from
              shifts s join
              shift_roles sr on sr.shift_id = s.id
            where sr.id = ${shiftRoleId}
          ) as o on o.start_time <= s.end_time and o.end_time >= s.start_time
        where b.user_id = ${userId})
    returning id`);
  return result;
}

export default {
  insert
};