const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  firstName,
  lastName,
  email,
  password,
  refreshToken,
  emailToken,
  isAdmin,
  imageId,
  phone,
  pager
}, client = pool) => {
  const result = await client.query(`
    insert into users(
      first_name,
      last_name,
      email,
      password,
      refresh_token,
      email_token,
      is_admin,
      image_id,
      phone,
      pager)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning id`, [
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      isAdmin,
      imageId,
      phone,
      pager]);
  return result.rows[0].id;
}

const addOrganisation = async (userId, organisationId, client = pool) => {
  await client.query(`
    insert into user_organisations(
      user_id,
      organisation_id)
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
      u.first_name,
      u.last_name,
      u.email,
      u.email_token
    from 
      users u,
      user_organisations o
    where
      u.id = $1 and
      o.user_id = u.id and
      o.organisation_id = $2`, [userId, organisationId]);
  return result.rows[0];
}

const setEmailToken = async (email, emailToken, client = pool) => {
  const result = await client.query(`
    update users
    set
      email_token = $2,
      email_token_expiry = now() + interval '1 day'
    where
      email = $1 and
      is_disabled is false
    returning 
      id, 
      first_name`, [email, emailToken]);
  return result.rows[0];
}

const getByEmail = async (email, client = pool) => {
  const result = await client.query(`
    with area_result as (
      select
        $1 as email,
        json_agg(json_build_object(
          'id', a.area_id, 
          'roleId', a.role_id,
          'isAdmin', a.is_admin)) as areas
      from
        users u,
        user_areas a
      where
        u.email = $1 and
        a.user_id = u.id and
        a.start_time <= now() and
        (a.end_time is null or a.end_time > now()))
    select 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.password,
      u.refresh_token,
      u.is_admin,
      u.is_disabled,
      u.is_verified,
      u.failed_password_attempts,
      o.organisation_id,
      case when a.areas is null then json_build_array() else a.areas end as areas
    from 
      users u join
      user_organisations o on u.id = o.user_id left join
      area_result a on u.email = a.email
    where
      u.email = $1 and
      u.is_disabled is false and
      u.is_verified is true and
      u.deleted_at is null and
      o.is_default`, [email]);
  return result.rows[0];
}

const getTasks = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      not exists (select 1 from roles where organisation_id = $1) as needs_roles,
      not exists (select 1 from locations where organisation_id = $1) as needs_locations,
      not exists (select 1 from areas where organisation_id = $1) as needs_areas,
      not exists (select 1 from tags where organisation_id = $1) as needs_tags,
      not exists (select 1 from user_roles where organisation_id = $1) as needs_users;`, [organisationId]);
  return result.rows[0];
}

const getRefreshToken = async (userId, client = pool) => {
  const result = await client.query(`
      select refresh_token
      from users
      where id = $1`, [userId]);
  return result.rows[0].refreshToken;
}

const changePassword = async (hash, refreshToken, userId, client = pool) => {
  await client.query(`
    update users 
    set password = $1, refresh_token = $2 
    where id = $3`, [hash, refreshToken, userId]);
}

const changePasswordWithToken = async (userId, emailToken, hash, client = pool) => {
  const result = await client.query(`
    update users
    set 
      password = $3,
      email_token = null,
      email_token_expiry = null,
      is_verified = true
    where
      id = $1 and
      email_token = $2 and
      email_token_expiry > now() and
      is_disabled is false`, [userId, emailToken, hash]);
  return result.rowCount === 1;
}

const find = async ({
  searchTerm,
  roleId,
  areaId,
  activeDate,
  lastUserId
}, isAdmin, areaIds, organisationId, client = pool) => {
  const params = [organisationId];

  const select = [];
  const where = [];

  const limit = 10;
  params.push(limit);

  if (!isAdmin) {
    let areaIdParams = [];
    for (const areaId of areaIds) {
      params.push(areaId);
      areaIdParams.push(`$${params.length}`);
    }
    where.push(`and a.id in (${areaIdParams.join(', ')})`);
  }
  if (searchTerm) {
    params.push(`%${searchTerm}%`);
    where.push(`and (
      concat_ws(' ', u.first_name, u.last_name) ilike $${params.length} or
      u.email ilike $${params.length})`);
  }
  if (roleId !== -1) {
    params.push(roleId);
    where.push(`and r.id = $${params.length}`);
  }
  if (areaId !== -1) {
    params.push(areaId);
    where.push(`and a.id = $${params.length}`);
  }
  if (activeDate) {
    params.push(activeDate);
    where.push(`and ua.start_time <= $${params.length} and (ua.end_time is null or ua.end_time >= $${params.length})`);
  }
  if (lastUserId === -1) {
    select.push('count(*) over() as total_count,');
  }
  else {
    params.push(lastUserId);
    where.push(`and u.id < $${params.length}`);
  }
  const result = await client.query(`
    with shift_result as (
      select
        b.user_id,
        count(*) as booked,
        sum(case when s.start_time >= now() then 0 else 1 end) as attended
      from
        bookings b join
        shifts s on b.shift_id = s.id
      where
        b.cancelled_at is null and
        s.deleted_at is null
      group by b.user_id)
    select 
      u.id,
      concat_ws(' ', u.first_name, u.last_name) as name,
      u.image_id,
      ${select.join('')}
      json_agg(distinct ua.role_id) as role_ids,
      json_agg(distinct a.abbreviation) as area_names,
      case when s.booked is null then 0 else s.booked end as booked,
      case when s.attended is null then 0 else s.attended end as attended
    from 
      user_areas ua join
      users u on ua.user_id = u.id join
      areas a on ua.area_id = a.id join
      roles r on ua.role_id = r.id join
      user_organisations uo on uo.user_id = u.id left join
      shift_result s on s.user_id = u.id
    where
      a.deleted_at is null and
      r.deleted_at is null and
      u.deleted_at is null and
      uo.organisation_id = $1
      ${where.join(' ')}
    group by u.id, s.booked, s.attended
    order by u.id desc
    limit $2`, params);
  if (result.rows.length === 0) {
    return {
      users: [],
      count: 0
    };
  }
  else {
    const count = lastUserId === -1 ? result.rows[0].totalCount : -1;
    return {
      users: result.rows,
      count
    };
  }
}

const update = async ({
  firstName,
  lastName,
  email
}, userId, client = pool) => {
  await client.query(`
    update users 
    set 
      first_name = $1,
      last_name = $2,
      email = $3
    where id = $4`, [firstName, lastName, email, userId]);
}

const changeImage = async (userId, imageId, organisationId, client = pool) => {
  await client.query(`
    update users
    set image_id = $2
    where 
      id = $1 and
      organisation_id = $3`, [userId, imageId, organisationId]);
}

const updateImages = async (images, organisationId, client = pool) => {
  const values = images
    .map((f, i) => `(${(i * 2) + 2}, ${(i * 2) + 3})`)
    .join(', ');
  const params = images.flatMap(i => [i.email, i.imageId]);
  const result = await client.query(`
    update users
    set image_id = i.image_id
    from
      (values ${values}) as i(email, image_id),
      users u,
      user_organisations o
    where
      email = i.email and
      u.email = i.email and
      o.user_id = u.id and
      o.organisation_id = $1
    returning email`, [organisationId, ...params]);
  return result.map(r => r.email);
}

const resetFailedPasswordAttempts = async (userId, client = pool) => {
  await client.query(`
    update users
    set failed_password_attempts = 0
    where id = $1`, [userId, amount]);
}

const incrementFailedPasswordAttempts = async (userId, client = pool) => {
  await client.query(`
    update users
    set 
      failed_password_attempts = failed_password_attempts + 1,
      is_disabled = case when 
        (failed_password_attempts + 1) = 5 then true
        else is_disabled end
    where
      id = $1 and
      is_disabled is false`, [userId]);
}

const disable = async (userId, client = pool) => {
  await client.query(`
    update users
    set is_disabled = true
    where id = $1`, [userId]);
}

const enable = async (userId, client = pool) => {
  await client.query(`
    update users
    set is_disabled = false
    where id = $1`, [userId]);
}

const verify = async (userId, emailToken, client = pool) => {
  const result = await client.query(`
    update users
    set 
      is_verified = true,
      email_token = null,
      email_token_expiry = null
    where
      id = $1 and
      is_disabled is false and
      is_verified is false and
      email_token is not null and
      email_token = $2 and
      email_token_expiry > now()`, [userId, emailToken]);
  return result.rowCount === 1;
}

const getPassword = async (userId, client = pool) => {
  const result = await client.query(`
    select password from users 
    where id = $1`, [userId]);
  return result.rows[0].password;
}

const remove = async (userId, organisationId, client = pool) => {
  await client.query(`
    update users
    set deleted_at = now()
    where 
      id = $1 and
      deleted_at is null and
      is_admin is false and
      exists(
        select 1 from user_organisations
        where
          user_id = $1 and
          organisation_id = $2)`, [userId, organisationId]);
}

module.exports = {
  insert,
  addOrganisation,
  checkEmailExists,
  getById,
  setEmailToken,
  getByEmail,
  getTasks,
  getRefreshToken,
  changePassword,
  changePasswordWithToken,
  find,
  update,
  changeImage,
  updateImages,
  resetFailedPasswordAttempts,
  incrementFailedPasswordAttempts,
  disable,
  enable,
  verify,
  getPassword,
  remove
};
