import getPool from '../database/db.js';
import { sql } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  userId,
  shiftId,
  shiftRoleId
}, bookedById, isAdmin, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into bookings(
      shift_id,
      shift_role_id,
      user_id,
      booked_by,
      organisation_id)
    select ${[
      shiftId,
      shiftRoleId,
      userId,
      bookedById,
      organisationId
    ]}
    where
      ${isAdmin ? sql`` : sql`
      exists(
        select count(*) filter (where b.id is not null) < sr.capacity
        from
          shift_roles sr left join
          bookings b on b.shift_role_id = sr.id
        where 
          b.shift_id = ${shiftId} and
          sr.id = ${shiftRoleId}
        group by sr.id) and`}
      exists(
        select 1
        from
          shifts s join
          shift_series ss on s.series_id = ss.id join
          shift_roles sr on sr.series_id = ss.id join
          roles r on sr.role_id = r.id join
          user_areas ua on ua.area_id = s.area_id and ua.role_id = sr.role_id
        where
          s.id = ${shiftId} and
          sr.id = ${shiftRoleId} and
          sr.organisation_id = ${organisationId} and
          ua.user_id = ${userId} and
          s.start_time >= ua.start_time and
          (ua.end_time is null or s.end_time < ua.end_time)
          ${isAdmin ? sql`` : sql` and
          s.start_time - interval '1 minute' * r.book_before_minutes > now()`}) and
      not exists(
        select 1
        from
          shifts s join
          shift_series ss on s.series_id = ss.id join
          shift_roles sr on sr.series_id = ss.id join
          bookings b on b.shift_id = s.id and b.shift_role_id = sr.id join
          (
            select s.start_time, s.end_time
            from
              shifts s join
              shift_series ss on s.series_id = ss.id join
              shift_roles sr on sr.series_id = ss.id
            where 
              s.id = ${shiftId} and 
              sr.id = ${shiftRoleId}
          ) as o on o.start_time <= s.end_time and o.end_time >= s.start_time
        where b.user_id = ${userId})
    returning id`);
  return result;
}

const transfer = async (shiftId, seriesId, organisationId, client = pool) => {
  const result = await client.query(sql`
    update bookings
    set shift_role_id = r.shift_role_id
    from (
      select
        b.id as booking_id,
        sr2.id as shift_role_id
      from
        bookings b join
        shift_roles sr1 on b.shift_role_id = sr1.id join
        shift_roles sr2 on 
          sr2.role_id = sr1.role_id and 
          sr2.series_id = ${seriesId}
      where
        b.shift_id = ${shiftId} and
        b.organisation_id = ${organisationId} and
        sr2.organisation_id = ${organisationId}) as r
    where id = r.booking_id`);
  return result;
}

const remove = async ({
  userId,
  bookingId
}, isAdmin, organisationId, client = pool) => {
  const checkCancelQuery = isAdmin ? sql`` : sql`
    and exists(
      select 1
      from
        shift_series ss join
        shifts s on s.series_id = ss.id join
        shift_roles sr on sr.series_id = ss.id join
        roles r on sr.role_id = r.id join
        bookings b on b.shift_id = s.id and b.shift_role_id = sr.id
      where
        b.id = ${bookingId} and
        r.can_book_and_cancel and
        s.start_time - interval '1 minute' * r.cancel_before_minutes > now())`;

  const result = await client.query(sql`
    delete from bookings
    where
      id = ${bookingId} and
      user_id = ${userId} and
      organisation_id = ${organisationId}
      ${checkCancelQuery}`);

  return result;
}

export default {
  insert,
  transfer,
  remove
};
