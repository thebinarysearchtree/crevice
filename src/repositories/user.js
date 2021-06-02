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
}, organisationId, client = pool) => {
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
      pager,
      organisation_id)
    values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      pager,
      organisationId]);
  return result.rows[0].id;
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
      id,
      first_name,
      last_name,
      email,
      email_token
    from users
    where
      id = $1 and
      organisation_id = $2`, [userId, organisationId]);
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
      u.organisation_id,
      coalesce(json_agg(json_build_object(
        'id', a.area_id, 
        'roleId', a.role_id,
        'isAdmin', a.is_admin)) filter (where a.area_id is not null), json_build_array()) as areas
    from 
      users u left join
      user_areas a on 
        a.user_id = u.id and
        a.start_time <= now() and
        (a.end_time is null or a.end_time > now())
    where
      u.email = $1 and
      u.is_disabled is false and
      u.is_verified is true
    group by u.id`, [email]);
  return result.rows[0];
}

const getUserDetails = async (userId, organisationId, client = pool) => {
  const result = await client.query(`
    with areas_result as (
      select
        ua.user_id,
        json_agg(distinct r.name) as roles,
        json_agg(distinct a.abbreviation) as areas
      from
        user_areas ua join
        roles r on ua.role_id = r.id join
        areas a on ua.area_id = a.id
      where
        ua.user_id = $1 and
        ua.start_time <= now() and
        (ua.end_time is null or ua.end_time > now())
      group by ua.user_id),
    user_result as (
      select
        u.id as user_id,
        concat_ws(' ', u.first_name, u.last_name) as name,
        u.email,
        u.phone,
        u.pager,
        u.image_id,
        coalesce(json_agg(json_build_object(
          'fieldName', f.name,
          'itemName', fi.name,
          'textValue', uf.text_value,
          'dateValue', uf.date_value) order by f.field_number asc) filter (where f.id is not null), json_build_array()) as fields
      from
        users u left join
        user_fields uf on uf.user_id = u.id left join
        fields f on uf.field_id = f.id left join
        field_items fi on uf.item_id = fi.id
      where 
        u.id = $1 and 
        u.organisation_id = $2
      group by u.id)
    select
      ur.*,
      coalesce(ar.roles, json_build_array()) as roles,
      coalesce(ar.areas, json_build_array()) as areas
    from
      user_result ur left join
      areas_result ar on ur.user_id = ar.user_id`, [userId, organisationId]);
  return result.rows[0];
}

const getTasks = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      not exists (select 1 from roles where organisation_id = $1) as needs_roles,
      not exists (select 1 from locations where organisation_id = $1) as needs_locations,
      not exists (select 1 from areas where organisation_id = $1) as needs_areas,
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
  activeState,
  lastUserId
}, isAdmin, areaIds, organisationId, client = pool) => {
  const params = [organisationId];

  const select = [];
  const where = [];
  let having = '';

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
    where.push(`and ua.start_time <= $${params.length} and (ua.end_time is null or ua.end_time > $${params.length})`);
  }
  if (activeState !== 'All') {
    if (activeState === 'Current') {
      having = 'having count(*) filter (where ua.start_time <= now() and (ua.end_time is null or ua.end_time > now())) > 0';
    }
    else if (activeState === 'Future') {
      having = 'having count(*) filter (where ua.start_time > now()) > 0';
    }
    else {
      having = 'having count(*) filter (where ua.start_time < now() and ua.end_time < now()) > 0';
    }
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
        count(*) filter (where s.start_time <= now()) as attended
      from
        bookings b join
        shift_roles sr on b.shift_role_id = sr.id join
        shifts s on sr.shift_id = s.id
      group by b.user_id)
    select 
      u.id,
      concat_ws(' ', u.first_name, u.last_name) as name,
      u.image_id,
      ${select.join('')}
      json_agg(distinct ua.role_id) as role_ids,
      json_agg(distinct a.abbreviation) as area_names,
      coalesce(s.booked, 0) as booked,
      coalesce(s.attended, 0) as attended
    from 
      user_areas ua join
      users u on ua.user_id = u.id join
      areas a on ua.area_id = a.id join
      roles r on ua.role_id = r.id left join
      shift_result s on s.user_id = u.id
    where
      u.organisation_id = $1
      ${where.join(' ')}
    group by u.id, s.booked, s.attended
    ${having}
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

const updateImageByPrimaryField = async ({
  fileId,
  fieldName,
  fieldValue
}, overwrite, organisationId, client = pool) => {
  const where = overwrite ? '' : ' and u.image_id is null';
  const result = await client.query(`
    update users u
    set image_id = $1
    where
      u.organisation_id = $3 and
      u.${fieldName} = $2
      ${where}`, [fileId, fieldValue, organisationId]);
  return result;
}

const updateImageByCustomField = async ({
  fileId,
  fieldName,
  fieldValue
}, overwrite, organisationId, client = pool) => {
  const where = overwrite ? '' : ' and u.image_id is null';
  const result = await client.query(`
    update users u
    set image_id = $1
    from 
      user_fields uf,
      fields f
    where
      uf.user_id = u.id and
      uf.field_id = f.id and
      u.organisation_id = $4 and
      f.name = $2 and
      uf.text_value = $3
      ${where}`, [fileId, fieldName, fieldValue, organisationId]);
  return result;
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
    delete from users
    where 
      id = $1 and
      organisation_id = $2 and
      is_admin is false`, [userId, organisationId]);
}

module.exports = {
  insert,
  checkEmailExists,
  getById,
  setEmailToken,
  getByEmail,
  getUserDetails,
  getTasks,
  getRefreshToken,
  changePassword,
  changePasswordWithToken,
  find,
  updateImageByPrimaryField,
  updateImageByCustomField,
  resetFailedPasswordAttempts,
  incrementFailedPasswordAttempts,
  disable,
  enable,
  verify,
  getPassword,
  remove
};
