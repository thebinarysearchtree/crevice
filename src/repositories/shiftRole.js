import getPool from '../database/db.js';
import { sql } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  seriesId,
  roleId,
  capacity,
  cancelBeforeMinutes,
  bookBeforeMinutes,
  canBookAndCancel
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into shift_roles(
      series_id,
      role_id,
      capacity,
      cancel_before_minutes,
      book_before_minutes,
      can_book_and_cancel,
      organisation_id)
    select ${[
      seriesId,
      roleId,
      capacity,
      cancelBeforeMinutes,
      bookBeforeMinutes,
      canBookAndCancel,
      organisationId]}
    from shifts s
    where
      s.series_id = ${seriesId} and
      s.organisation_id = ${organisationId} and
      exists(
        select 1 from roles
        where
          id = ${roleId} and
          organisation_id = ${organisationId}) and
      not exists(
        select 1 from shift_roles
        where
          series_id = ${seriesId} and
          role_id = ${roleId})
    returning id`);
  return result.rows[0].id;
}

export default {
  insert
};
