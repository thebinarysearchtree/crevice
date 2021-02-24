const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  firstName,
  lastName,
  email,
  password,
  refreshToken,
  emailToken,
  isAdmin
}, client = pool) => {
  const result = await client.query(`
    insert into users(
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      isAdmin)
    values($1, $2, $3, $4, $5, $6, $7)
    returning id`, [
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      isAdmin]);
  return result.rows[0].id;
}

const insertUsers = async (users, client) => {
  const values = users.flatMap(u => {
    const {
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
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
      isAdmin,
      imageId
    };
  });
  const params = users
    .map((u, i) => `($${(i * 8) + 1}, $${(i * 8) + 2}, $${(i * 8) + 3}, $${(i * 8) + 4}, $${(i * 8) + 5}, $${(i * 8) + 6}, $${(i * 8) + 7}, $${(i * 8) + 8})`)
    .join(', ');
  return await client.query(`
    insert into users(
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      isAdmin,
      imageId)
    values${params}
    returning
      id,
      firstName,
      lastName,
      email,
      emailToken`, values);
}

const insertUserOrganisations = async (userIds, organisationId, client) => {
  const params = userIds.map((v, i) => `($1, $${i + 2})`).join(', ');
    await client.query(`
      insert into userOrganisations(
        organisationId,
        userId)
      values${params}`, [organisationId, ...userIds]);
}

const validateTags = async (tagIds, organisationId, client) => {
  const params = tagIds.map((t, i) => `${i + 2}`).join(', ');
  const result = await client.query(`
    select count(*) as "validTags"
    from tags
    where 
      id in (${params}) and
      organisationId = $1`, [organisationId, ...tagIds]);
  return result[0].validTags === tagIds.length;
}

const insertUserTags = async (userIds, tagIds, organisationId, client) => {
  const userParams = userIds.map((v, i) => `($${i + 2})`).join(', ');
  const tagParams = tagIds.map((t, i) => `($${i + userIds.length + 2})`).join(', ');
  await client.query(`
    insert into userTags(
      userId,
      tagId,
      organisationId)
    select 
      u.id as userId,
      t.id as tagId,
      $1 as organisationId
    from 
      (values ${userParams}) as u(id),
      (values ${tagParams}) as t(id)`, [organisationId, ...userIds, ...tagIds]);
}

const validateRoles = async (roleIds, organisationId, client) => {
  const params = roleIds.map((r, i) => `${i + 2}`).join(', ');
  const result = await client.query(`
    select count(*) as "validRoles"
    from roles
    where
      id in (${params}) and
      organisationId = $1`, [organisationId, ...roleIds]);
  return result[0].validRoles === roles.length;
}

const insertUserRoles = async (userIds, roles, organisationId, client) => {
  const userParams = userIds
    .map((v, i) => `($${i + 2})`)
    .join(', ');
  const roleParams = roles
    .map((r, i) => `(${i + userIds.length + 2}, ${i + userIds.length + 3})`)
    .join(', ');
  await client.query(`
    insert into userRoles(
      userId,
      roleId,
      isPrimary,
      organisationId)
    select
      u.id as userId,
      r.id as roleId,
      r.isPrimary,
      $1 as organisationId
    from
      (values ${userParams}) as u(id),
      (values ${roleParams}) as r(id, isPrimary)`, [organisationId, ...userIds, ...roles.flatMap(r => [r.id, r.isPrimary])]);
}

const insertMany = async (users, tagIds, roles, organisationId) => {
  if (roles.length === 0) {
    throw Error();
  }
  const client = pool.connect();
  try {
    await client.query('begin');
    const insertedUsers = await insertUsers(users, client);
    const userIds = insertedUsers.map(r => r.id);
    await insertUserOrganisations(userId, organisationId, client);
    if (tagIds.length > 0) {
      const tagsAreValid = await validateTags(tagIds, organisationId, client);
      if (!tagsAreValid) {
        throw Error();
      }
      await insertUserTags(userIds, tagIds, organisationId, client);
    }
    const roleIds = roles.map(r => r.id);
    const rolesAreValid = await validateRoles(roleIds, organisationId, client);
    if (!rolesAreValid) {
      throw Error();
    }
    await insertUserRoles(userIds, roles, organisationId, client);
    await client.query('commit');
    return insertedUsers;
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

const getById = async (userId, organisationId, client = pool) => {
  const result = await client.query(`
    select
      u.id,
      u.firstName as "firstName",
      u.lastName as "lastName",
      u.email,
      u.emailToken as "emailToken"
    from 
      users u,
      userOrganisations o
    where
      u.id = $1 and
      o.userId = u.id and
      o.organisationId = $2`, [userId, organisationId]);
  return result.rows[0];
}

const setEmailToken = async (email, emailToken, client = pool) => {
  const result = await client.query(`
    update users
    set
      emailToken = $2,
      emailTokenExpiry = now() + interval '1 day'
    where
      email = $1 and
      isDisabled is false
    returning 
      id, 
      firstName`, [email, emailToken]);
  return result.rows[0];
}

const getByEmail = async (email, client = pool) => {
  const result = await client.query(`
    with availableRoles as (
      select
        $1 as "email",
        json_agg(json_build_object(
          'id', r.id,
          'name', r.name,
          'defaultView', r.defaultView,
          'canEditBookingBefore', r.canEditBookingBefore,
          'canEditBookingAfter', r.canEditBookingAfter,
          'canRequestEdit', r.canRequestEdit,
          'canApproveEdit', r.canApproveEdit,
          'canBookAndCancelForOthers', r.canBookAndCancelForOthers,
          'canEditShift', r.canEditShift,
          'canViewProfiles', r.canViewProfiles,
          'canViewAnswers', r.canViewAnswers)) as "roles"
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
          'roleId', a.roleId)) as "areas"
      from
        users u,
        userAreas a
      where
        u.email = $1 and
        a.userId = u.id and
        a.startTime <= now() and
        (a.endTime is null or a.endTime > now()))
    select 
      u.id,
      u.firstName as "firstName",
      u.lastName as "lastName",
      u.email,
      u.password,
      u.refreshToken as "refreshToken",
      u.isAdmin as "isAdmin",
      u.isDisabled as "isDisabled",
      u.isVerified as "isVerified",
      u.failedPasswordAttempts as "failedPasswordAttempts",
      case when 
        r.email is null then json_build_array()
        else r.roles end as "roles",
      case when
        a.email is null then json_build_array()
        else a.areas end as "areas",
      o.organisationId as "organisationId"
    from 
      users u join
      userOrganisations o on u.id = o.userId
      left join
      availableRoles r on u.email = r.email
      left join
      availableAreas a on u.email = a.email
    where
      u.email = $1 and
      o.isDefault`, [email]);
  return result.rows[0];
}

const getTasks = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      not exists (select 1 from roles where organisationId = $1) as "needsRoles",
      not exists (select 1 from locations where organisationId = $1) as "needsLocations",
      not exists (select 1 from areas where organisationId = $1) as "needsAreas",
      not exists (select 1 from tags where organisationId = $1) as "needsTags",
      not exists (select 1 from userRoles where organisationId = $1) as "needsUsers";`, [organisationId]);
  return result.rows[0];
}

const getRefreshToken = async (userId, client = pool) => {
  const result = await client.query(`
      select refreshToken as "refreshToken"
      from users
      where id = $1`, [userId]);
  return result.rows[0].refreshToken;
}

const changePassword = async (hash, refreshToken, userId, client = pool) => {
  await client.query(`
    update users 
    set password = $1, refreshToken = $2 
    where id = $3`, [hash, refreshToken, userId]);
}

const changePasswordWithToken = async (userId, emailToken, hash, client = pool) => {
  const result = await client.query(`
    update users
    set 
      password = $3,
      emailToken = null,
      emailTokenExpiry = null,
      isVerified = true
    where
      id = $1 and
      emailToken = $2 and
      emailTokenExpiry > now() and
      isDisabled is false`, [userId, emailToken, hash]);
  return result.rowCount === 1;
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

const changeImage = async (userId, imageId, organisationId, client = pool) => {
  await client.query(`
    update users
    set imageId = $2
    where 
      id = $1 and
      organisationId = $3`, [userId, imageId, organisationId]);
}

const updateImages = async (images, organisationId, client = pool) => {
  const values = images
    .map((f, i) => `(${(i * 2) + 2}, ${(i * 2) + 3})`)
    .join(', ');
  const params = images.flatMap(i => [i.email, i.imageId]);
  const result = await client.query(`
    update users
    set imageId = i.imageId
    from
      (values ${values}) as i(email, imageId),
      users u,
      userOrganisations o
    where
      email = i.email and
      u.email = i.email and
      o.userId = u.id and
      o.organisationId = $1
    returning email`, [organisationId, ...params]);
  return result.map(r => r.email);
}

const changeTag = async (userId, tagId, organisationId, client = pool) => {
  await client.query(`
    update users
    set tagId = $2
    where
      id = $1 and
      ($2 is null or exists(
        select 1 from tags
        where
          id = $2 and
          organisationId = $3))`, [userId, tagId, organisationId]);
}

const resetFailedPasswordAttempts = async (userId, client = pool) => {
  await client.query(`
    update users
    set failedPasswordAttempts = 0
    where id = $1`, [userId, amount]);
}

const incrementFailedPasswordAttempts = async (userId, client = pool) => {
  await client.query(`
    update users
    set 
      failedPasswordAttempts = failedPasswordAttempts + 1,
      isDisabled = case when 
        (failedPasswordAttempts + 1) = 5 then true
        else isDisabled end
    where
      id = $1 and
      isDisabled is false`, [userId]);
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

const verify = async (userId, emailToken, client = pool) => {
  const result = await client.query(`
    update users
    set 
      isVerified = true,
      emailToken = null,
      emailTokenExpiry = null
    where
      id = $1 and
      isDisabled is false and
      isVerified is false and
      emailToken is not null and
      emailToken = $2 and
      emailTokenExpiry > now()`, [userId, emailToken]);
  return result.rowCount === 1;
}

const getPassword = async (userId, client = pool) => {
  const result = await client.query(`
    select password from users 
    where id = $1`, [userId]);
  return result.rows[0].password;
}

const deleteById = async (userId, organisationId, client = pool) => {
  await client.query(`
    delete from users 
    where 
      id = $1 and
      exists(
        select 1 from userOrganisations
        where
          userId = $1 and
          organisationId = $2) and
      isAdmin is false`, [userId, organisationId]);
}

module.exports = {
  insert,
  insertMany,
  addOrganisation,
  checkEmailExists,
  getById,
  setEmailToken,
  getByEmail,
  getTasks,
  getRefreshToken,
  changePassword,
  changePasswordWithToken,
  update,
  changeImage,
  updateImages,
  changeTag,
  resetFailedPasswordAttempts,
  incrementFailedPasswordAttempts,
  disable,
  enable,
  verify,
  getPassword,
  deleteById
};
