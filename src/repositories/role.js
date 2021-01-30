const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name,
  defaultView,
  canBookBefore,
  canBookAfter,
  canCancelBefore,
  canCancelAfter,
  canRequestCancellation,
  canApproveCancellation,
  canBookForOthers,
  canCancelForOthers,
  canDelete,
  canEditBefore,
  canEditAfter,
  canChangeCapacity,
  canAssignTasks,
  canInviteUsers
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into roles(
      name,
      defaultView,
      canBookBefore,
      canBookAfter,
      canCancelBefore,
      canCancelAfter,
      canRequestCancellation,
      canApproveCancellation,
      canBookForOthers,
      canCancelForOthers,
      canDelete,
      canEditBefore,
      canEditAfter,
      canChangeCapacity,
      canAssignTasks,
      canInviteUsers,
      organisationId)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    returning id`, [
      name,
      defaultView,
      canBookBefore,
      canBookAfter,
      canCancelBefore,
      canCancelAfter,
      canRequestCancellation,
      canApproveCancellation,
      canBookForOthers,
      canCancelForOthers,
      canDelete,
      canEditBefore,
      canEditAfter,
      canChangeCapacity,
      canAssignTasks,
      canInviteUsers,
      organisationId]);
  return result.rows[0][0];
}

const update = async ({
  id,
  name,
  defaultView,
  canBookBefore,
  canBookAfter,
  canCancelBefore,
  canCancelAfter,
  canRequestCancellation,
  canApproveCancellation,
  canBookForOthers,
  canCancelForOthers,
  canDelete,
  canEditBefore,
  canEditAfter,
  canChangeCapacity,
  canAssignTasks,
  canInviteUsers
}, organisationId, client = pool) => {
  const result = await client.query(`
    update roles
    set
      name = $2,
      defaultView = $3,
      canBookBefore = $4,
      canBookAfter = $5,
      canCancelBefore = $6,
      canCancelAfter = $7,
      canRequestCancellation = $8,
      canApproveCancellation = $9,
      canBookForOthers = $10,
      canCancelForOthers = $11,
      canDelete = $12,
      canEditBefore = $13,
      canEditAfter = $14,
      canChangeCapacity = $15,
      canAssignTasks = $16,
      canInviteUsers = $17
    where
      id = $1 and
      organisationId = $16`, [
        id,
        name,
        defaultView,
        canBookBefore,
        canBookAfter,
        canCancelBefore,
        canCancelAfter,
        canRequestCancellation,
        canApproveCancellation,
        canBookForOthers,
        canCancelForOthers,
        canDelete,
        canEditBefore,
        canEditAfter,
        canChangeCapacity,
        canAssignTasks,
        canInviteUsers,
        organisationId]);
}

const getById = async (roleId, organisationId, client = pool) => {
  const result = await client.query(`
    select
      name,
      defaultView as "defaultView",
      canBookBefore as "canBookBefore",
      canBookAfter as "canBookAfter",
      canCancelBefore as "canCancelBefore",
      canCancelAfter as "canCancelAfter",
      canRequestCancellation as "canRequestCancellation",
      canApproveCancellation as "canApproveCancellation",
      canBookForOthers as "canBookForOthers",
      canCancelForOthers as "canCancelForOthers",
      canDelete as "canDelete",
      canEditBefore as "canEditBefore",
      canEditAfter as "canEditAfter",
      canChangeCapacity as "canChangeCapacity",
      canAssignTasks as "canAssignTasks",
      canInviteUsers as "canInviteUsers",
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
