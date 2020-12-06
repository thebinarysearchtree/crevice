const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  firstName,
  lastName,
  email,
  password,
  refreshToken,
  emailToken = null,
  emailTokenExpiry = null,
  isAdmin,
  organisationId
}, client = pool) => {
  const result = await client.query(`
    insert into users(
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      emailTokenExpiry,
      isAdmin,
      organisationId)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9)
    returning id`, [
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      emailTokenExpiry,
      isAdmin,
      organisationId]);
  return result.rows[0].id;
}

const insertMany = async (users, tagId, organisationId) => {
  let values = users.flatMap(u => {
    const {
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken = null,
      emailTokenExpiry = null,
      isAdmin,
      imageId
    } = u;
    return {
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      emailTokenExpiry,
      isAdmin,
      imageId
    };
  });
  let params = users
    .map((u, i) => `($1, $2, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7}, $${i + 8}, $${i + 9}, $${i + 10}, $${i + 11})`)
    .join(', ');
  const client = pool.connect();
  try {
    await client.query('begin');
    const result = await client.query(`
      insert into users(
        organisationId,
        tagId,
        firstName,
        lastName,
        email,
        password,
        refreshToken,
        emailToken,
        emailTokenExpiry,
        isAdmin,
        imageId)
      values${params}
      where ($2 is null or exists(
        select 1 from tags
        where
          id = $2 and
          organisationId = $1))
      returning
        id,
        firstName,
        lastName,
        email,
        emailToken`, [organisationId, tagId, ...values]);
    let values = result.map(r => r.id);
    let params = values.map((v, i) => `($1, $${i + 2})`).join(', ');
    await client.query(`
      insert into userOrganisations(
        organisationId,
        userId)
      values${params}`, [organisationId, ...values]);
    await client.query('commit');
    return result;
  }
  catch (e) {
    await client.query('rollback');
  }
  finally {
    client.release();
  }
}

const addOrganisation = async (userId, organisationId, client = pool) => {
  await client.query(`
    insert into userOrganisations(
      userId,
      organisationId)
    values($1, $2)`, [userId, organisationId]);
}

const checkEmailExists = async (email, client = pool) => {
  const result = await client.query(`
    select exists(
      select 1 from users 
      where email = $1) as exists`, [email]);
  return result.rows[0].exists;
}

const getByEmail = async (email, organisationId, client = pool) => {
  const result = await client.query(`
    with availableRoles as (
      select
        $1 as "email",
        json_agg(json_build_object(
          'id', r.id,
          'canBookBefore', r.canBookBefore,
          'canBookAfter', r.canBookAfter,
          'canCancelBefore', r.canCancelBefore',
          'canCancelAfter', r.canCancelAfter',
          'canBookForRoleId', r.canBookForRoleId,
          'canCancelForRoleId', r.canCancelForRoleId,
          'canDelete', r.canDelete,
          'canEditBefore', r.canEditBefore,
          'canEditAfter', r.canEditAfter,
          'canChangeCapacity', r.canChangeCapacity,
          'canAssignTasks', r.canAssignTasks,
          'canInviteUsers', r.canInviteUsers)) as "roles"
      from
        users u,
        userRoles ur,
        roles r
      where
        u.email = $1 and
        ur.userId = u.id and
        ur.roleId = r.id),
    availableAreas as (
      select
        $1 as "email",
        json_agg(json_build_object(
          'id', a.areaId,
          'startTime', a.startTime,
          'endTime', a.endTime,
          'roleId', a.roleId)) as "areas"
      from
        users u,
        userAreas a
      where
        u.email = $1 and
        a.userId = u.id),
    select 
      u.id,
      u.firstName as "firstName",
      u.lastName as "lastName,
      u.email,
      u.password,
      u.refreshToken as "refreshToken",
      u.isAdmin as "isAdmin",
      u.isDisabled as "isDisabled",
      u.failedPasswordAttempts as "failedPasswordAttempts",
      case when 
        r.email is null then json_build_array()
        else r.roles end as "roles",
      case when
        a.email is null then json_build_array()
        else a.areas end as "areas",
      o.organisationId as "organisationId"
    from 
      users u,
      userOrganisations o
      left join
      availableRoles r on u.email = r.email
      left join
      availableAreas a on u.email = a.email
    where
      u.email = $1 and
      u.id = o.userId and
      o.organisationId = $2`, [email, organisationId]);
  return result.rows[0];
}

const getRefreshToken = async (id, client = pool) => {
  const result = await client.query(`
      select refreshToken as "refreshToken"
      from users
      where id = $1`, [id]);
  return result.rows[0].refreshToken;
}

const changePassword = async (hash, refreshToken, id, client = pool) => {
  await client.query(`
    update users 
    set password = $1, refreshToken = $2 
    where id = $3`, [hash, refreshToken, id]);
}

const update = async ({
  firstName,
  lastName,
  email
}, userId, client = pool) => {
  await client.query(`
    update users 
    set 
      firstName = $1,
      lastName = $2,
      email = $3
    where id = $4`, [firstName, lastName, email, userId]);
}

const updateFailedPasswordAttempts = async (userId, amount, client = pool) => {
  await client.query(`
    update users
    set failedPasswordAttempts = $2
    where id = $1`, [userId, amount]);
}

const disable = async (userId, client = pool) => {
  await client.query(`
    update users
    set isDisabled = true
    where id = $1`, [userId]);
}

const enable = async (userId, client = pool) => {
  await client.query(`
    update users
    set isDisabled = false
    where id = $1`, [userId]);
}

const getPassword = async (id, client = pool) => {
  const result = await client.query(`
    select password from users 
    where id = $1`, [id]);
  return result.rows[0].password;
}

const deleteById = async (userId, organisationId, client = pool) => {
  await client.query(`
    delete from users 
    where 
      id = $1 and 
      organisationId = $2 and
      isAdmin is false`, [userId, organisationId]);
}

module.exports = {
  insert,
  insertMany,
  addOrganisation,
  checkEmailExists,
  getByEmail,
  getRefreshToken,
  changePassword,
  update,
  updateFailedPasswordAttempts,
  disable,
  enable,
  getPassword,
  deleteById
};
