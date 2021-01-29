const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name,
  defaultView,
  canBookBefore,
  canBookAfter,
  canCancelBefore,
  canCancelAfter,
  canBookForRoleId,
  canCancelForRoleId,
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
      canBookForRoleId,
      canCancelForRoleId,
      canDelete,
      canEditBefore,
      canEditAfter,
      canChangeCapacity,
      canAssignTasks,
      canInviteUsers,
      organisationId)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    where
      ($7 is null or exists(
        select 1 from roles
        where
          id = $7 and
          organisationId = $15)) and
      ($8 is null or exists(
        select 1 from roles
        where
          id = $8 and
          organisationId = $15))
    returning id`, [
      name,
      defaultView,
      canBookBefore,
      canBookAfter,
      canCancelBefore,
      canCancelAfter,
      canBookForRoleId,
      canCancelForRoleId,
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
  canBookForRoleId,
  canCancelForRoleId,
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
      canBookForRoleId = $8,
      canCancelForRoleId = $9,
      canDelete = $10,
      canEditBefore = $11,
      canEditAfter = $12,
      canChangeCapacity = $13,
      canAssignTasks = $14,
      canInviteUsers = $15
    where
      id = $1 and
      organisationId = $16 and
      ($8 is null or exists(
        select 1 from roles
        where
          id = $8 and
          organisationId = $16)) and
      ($9 is null or exists(
        select 1 from roles
        where
          id = $9 and
          organisationId = $16))`, [
            id,
            name,
            defaultView,
            canBookBefore,
            canBookAfter,
            canCancelBefore,
            canCancelAfter,
            canBookForRoleId,
            canCancelForRoleId,
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
      canBookForRoleId as "canBookForRoleId",
      canCancelForRoleId as "canCancelForRoleId",
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
