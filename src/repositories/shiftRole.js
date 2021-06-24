const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  shiftId,
  seriesId,
  roleId,
  capacity,
  cancelBeforeMinutes,
  bookBeforeMinutes,
  canBookAndCancel,
  canAssign,
  canBeAssigned
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into shift_roles(
      shift_id,
      role_id,
      capacity,
      cancel_before_minutes,
      book_before_minutes,
      can_book_and_cancel,
      can_assign,
      can_be_assigned,
      organisation_id)
    select s.id, $2, $3, $4, $5, $6, $7, $8, $9
    from shifts s
    where
      ${seriesId ? 's.series_id = $1' : 's.id = $1'} and
      s.organisation_id = $9 and
      exists(
        select 1 from roles
        where
          id = $2 and
          organisation_id = $9) and
      not exists(
        select 1 from shift_roles
        where
          shift_id = s.id and
          role_id = $2)
    returning id`, [
      seriesId ? seriesId : shiftId,
      roleId,
      capacity,
      cancelBeforeMinutes,
      bookBeforeMinutes,
      canBookAndCancel,
      canAssign,
      canBeAssigned,
      organisationId]);
  return result;
}

module.exports = {
  insert
};
