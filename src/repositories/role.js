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
      defaultView,
      canEditBookingBefore,
      canEditBookingAfter,
      canRequestEdit,
      canApproveEdit,
      canBookForOthers,
      canBookAndCancelForOthers,
      canEditShift,
      canViewProfiles,
      canViewAnswers,
      organisationId)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      defaultView = $3,
      canEditBookingBefore = $4,
      canEditBookingAfter = $5,
      canRequestEdit = $6,
      canApproveEdit = $7,
      canBookAndCancelForOthers = $8,
      canEditShift = $9,
      canViewProfiles = $10,
      vanViewAnswers = $11
    where
      id = $1 and
      organisationId = $12`, [
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
    select
      name,
      defaultView as "defaultView",
      canEditBookingBefore as "canEditBookingBefore",
      canEditBookingAfter as "canEditBookingAfter",
      canRequestEdit as "canRequestEdit",
      canApproveEdit as "canApproveEdit",
      canBookAndCancelForOthers as "canBookAndCancelForOthers",
      canEditShift as "canEditShift",
      canViewProfiles as "canViewProfiles",
      canViewAnswers as "canViewAnswers",
      createdAt as "createdAt"
    from roles
    where 
      id = $1 and 
      organisationId = $2`, [roleId, organisationId]);
  return result.rows[0];
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id, 
      name 
    from roles 
    where organisationId = $1
    order by name desc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      r.name,
      r.createdAt as "createdAt",
      sum(case when u.userId is null then 0 else 1 end) as "userCount"
    from 
      roles r left join
      userRoles u on r.id = u.roleId
    where
      r.organisationId = $1
    group by
      r.name,
      r.createdAt,
      u.userId`, [organisationId]);
  return result.rows;
}

const remove = async (roleId, organisationId, client = pool) => {
  await client.query(`
    delete from roles
    where
      id = $1 and
      organisationId = $2`, [roleId, organisationId]);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
