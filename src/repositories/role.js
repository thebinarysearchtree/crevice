const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name,
  defaultView,
  canEditBookingBefore,
  canEditBookingAfter,
  canRequestEdit,
  canApproveEdit,
  canBookAndCancelForOthers,
  canEditShift,
  canViewProfiles,
  canViewAnswers
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into roles(
      name,
      default_view,
      can_edit_booking_before,
      can_edit_booking_after,
      can_request_edit,
      can_approve_edit,
      can_book_and_cancel_for_others,
      can_edit_shift,
      can_view_profiles,
      can_view_answers,
      organisation_id)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    returning id`, [
      name,
      defaultView,
      canEditBookingBefore,
      canEditBookingAfter,
      canRequestEdit,
      canApproveEdit,
      canBookAndCancelForOthers,
      canEditShift,
      canViewProfiles,
      canViewAnswers,
      organisationId]);
  return result.rows[0].id;
}

const update = async ({
  roleId,
  name,
  defaultView,
  canEditBookingBefore,
  canEditBookingAfter,
  canRequestEdit,
  canApproveEdit,
  canBookAndCancelForOthers,
  canEditShift,
  canViewProfiles,
  canViewAnswers
}, organisationId, client = pool) => {
  await client.query(`
    update roles
    set
      name = $2,
      default_view = $3,
      can_edit_booking_before = $4,
      can_edit_booking_after = $5,
      can_request_edit = $6,
      can_approve_edit = $7,
      can_book_and_cancel_for_others = $8,
      can_edit_shift = $9,
      can_view_profiles = $10,
      can_view_answers = $11
    where
      id = $1 and
      organisation_id = $12`, [
        roleId,
        name,
        defaultView,
        canEditBookingBefore,
        canEditBookingAfter,
        canRequestEdit,
        canApproveEdit,
        canBookAndCancelForOthers,
        canEditShift,
        canViewProfiles,
        canViewAnswers,
        organisationId]);
}

const getById = async (roleId, organisationId, client = pool) => {
  const result = await client.query(`
    select * from roles
    where 
      id = $1 and 
      organisation_id = $2`, [roleId, organisationId]);
  return result.rows[0];
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id, 
      name 
    from roles 
    where organisation_id = $1
    order by name desc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      r.id,
      r.name,
      r.created_at as created_at,
      sum(case when u.user_id is null then 0 else 1 end) as "user_count"
    from 
      roles r left join
      user_roles u on r.id = u.role_id
    where
      r.organisation_id = $1
    group by
      r.id,
      u.user_id`, [organisationId]);
  return result.rows;
}

const remove = async (roleId, organisationId, client = pool) => {
  await client.query(`
    delete from roles
    where
      id = $1 and
      organisation_id = $2`, [roleId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
