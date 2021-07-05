const getPool = require('../database/db');
const { sql } = require('../utils/data');

const pool = getPool();

const insert = async ({
  shiftId,
  seriesId,
  roleId,
  capacity,
  cancelBeforeMinutes,
  bookBeforeMinutes,
  canBookAndCancel
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into shift_roles(
      shift_id,
      role_id,
      capacity,
      cancel_before_minutes,
      book_before_minutes,
      can_book_and_cancel,
      organisation_id)
    select s.id, ${[
      roleId,
      capacity,
      cancelBeforeMinutes,
      bookBeforeMinutes,
      canBookAndCancel,
      organisationId]}
    from shifts s
    where
      ${seriesId ? sql`s.series_id = ${seriesId}` : sql`s.id = ${shiftId}`} and
      s.organisation_id = ${organisationId} and
      exists(
        select 1 from roles
        where
          id = ${roleId} and
          organisation_id = ${organisationId}) and
      not exists(
        select 1 from shift_roles
        where
          shift_id = s.id and
          role_id = ${roleId})
    returning id`);
  return result.rows[0].id;
}

module.exports = {
  insert
};
