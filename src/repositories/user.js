import getPool from '../database/db.js';
import { sql, wrap, makeReviver } from '../utils/data.js';

const reviver = makeReviver();

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
  const result = await client.query(sql`
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
    values(${[
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
      organisationId]})
    returning id`);
  return result.rows[0].id;
}

const checkEmailExists = async (email, client = pool) => {
  const result = await client.query(sql`
    select exists(
      select 1 from users 
      where email = ${email}) as exists`);
  return result.rows[0].exists;
}

const getById = async (userId, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select
      id,
      first_name,
      last_name,
      email,
      email_token
    from users
    where
      id = ${userId} and
      organisation_id = ${organisationId}`);
  return JSON.parse(result.rows[0].result, reviver)[0];
}

const setEmailToken = async (email, emailToken, client = pool) => {
  const result = await client.query(sql`
    update users
    set
      email_token = ${emailToken},
      email_token_expiry = now() + interval '1 day'
    where
      email = ${email} and
      is_disabled is false
    returning 
      id, 
      first_name`);
  const { id: userId, first_name: firstName } = result.rows[0];
  return { userId, firstName };
}

const getByEmail = async (email, client = pool) => {
  const result = await client.query(wrap`
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
        'role_id', a.role_id,
        'is_admin', a.is_admin)) filter (where a.area_id is not null), json_build_array()) as areas
    from 
      users u left join
      user_areas a on 
        a.user_id = u.id and
        a.start_time <= now() and
        (a.end_time is null or a.end_time > now())
    where
      u.email = ${email} and
      u.is_disabled is false and
      u.is_verified is true
    group by u.id`);
  return JSON.parse(result.rows[0].result, reviver)[0];
}

const getUserDetails = async (userId, organisationId, client = pool) => {
  const areasQuery = sql`
    select
      ua.user_id,
      json_agg(distinct r.name) as roles,
      json_agg(distinct a.name) as areas
    from
      user_areas ua join
      roles r on ua.role_id = r.id join
      areas a on ua.area_id = a.id
    where
      ua.user_id = ${userId} and
      ua.start_time <= now() and
      (ua.end_time is null or ua.end_time > now())
    group by ua.user_id`;

  const usersQuery = sql`
    select
      u.id as user_id,
      concat_ws(' ', u.first_name, u.last_name) as name,
      u.email,
      u.phone,
      u.pager,
      u.image_id,
      coalesce(json_agg(json_build_object(
        'field_name', f.name,
        'item_name', fi.name,
        'text_value', uf.text_value,
        'date_value', uf.date_value) order by f.field_number asc) filter (where f.id is not null), json_build_array()) as fields
    from
      users u left join
      user_fields uf on uf.user_id = u.id left join
      fields f on uf.field_id = f.id left join
      field_items fi on uf.item_id = fi.id
    where 
      u.id = ${userId} and 
      u.organisation_id = ${organisationId}
    group by u.id`;
  
  const result = await client.query(wrap`
    select
      ur.*,
      coalesce(ar.roles, json_build_array()) as roles,
      coalesce(ar.areas, json_build_array()) as areas
    from
      (${usersQuery}) as ur left join
      (${areasQuery}) as ar on ur.user_id = ar.user_id`);
  return result.rows[0].result;
}

const getTasks = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select 
      not exists (select 1 from roles where organisation_id = ${organisationId}) as needs_roles,
      not exists (select 1 from locations where organisation_id = ${organisationId}) as needs_locations,
      not exists (select 1 from areas where organisation_id = ${organisationId}) as needs_areas,
      not exists (select 1 from user_roles where organisation_id = ${organisationId}) as needs_users;`);
  return result.rows[0].result;
}

const getRefreshToken = async (userId, client = pool) => {
  const result = await client.query(wrap`
      select refresh_token
      from users
      where id = ${userId}`);
  return result.rows[0].result;
}

const changePassword = async (hash, refreshToken, userId, client = pool) => {
  await client.query(sql`
    update users 
    set password = ${hash}, refresh_token = ${refreshToken}
    where id = ${userId}`);
}

const changePasswordWithToken = async (userId, emailToken, hash, client = pool) => {
  const result = await client.query(sql`
    update users
    set 
      password = ${hash},
      email_token = null,
      email_token_expiry = null,
      is_verified = true
    where
      id = ${userId} and
      email_token = ${emailToken} and
      email_token_expiry > now() and
      is_disabled is false`);
  return result.rowCount === 1;
}

const find = async ({
  searchTerm,
  roleId,
  areaId,
  activeDate,
  activeState,
  page
}, isAdmin, areaIds, organisationId, client = pool) => {
  const select = [];
  const where = [];
  const limit = 10;
  const offset = limit * page;
  let having = sql``;

  if (!isAdmin) {
    where.push(sql`and a.id in (${areaIds})`);
  }
  if (searchTerm) {
    searchTerm = `%${searchTerm}%`;
    where.push(sql`and (
      concat_ws(' ', u.first_name, u.last_name) ilike ${searchTerm} or
      u.email ilike ${searchTerm})`);
  }
  if (roleId !== -1) {
    where.push(sql`and r.id = ${roleId}`);
  }
  if (areaId !== -1) {
    where.push(sql`and a.id = ${areaId}`);
  }
  if (activeDate) {
    where.push(sql`and ua.start_time <= ${activeDate} and (ua.end_time is null or ua.end_time > ${activeDate})`);
  }
  if (activeState !== 'All') {
    if (activeState === 'Current') {
      having = sql`having count(*) filter (where ua.start_time <= now() and (ua.end_time is null or ua.end_time > now())) > 0`;
    }
    else if (activeState === 'Future') {
      having = sql`having count(*) filter (where ua.start_time > now()) > 0`;
    }
    else {
      having = sql`having count(*) filter (where ua.start_time < now() and ua.end_time < now()) > 0`;
    }
  }
  if (page === 0) {
    select.push(sql`count(*) over() as total_count,`);
  }

  const shiftsQuery = sql`
    select
      b.user_id,
      count(*) as booked,
      count(*) filter (where s.start_time <= now()) as attended,
      sum(s.end_time - s.start_time) filter (where s.start_time <= now()) as attended_time
    from
      bookings b join
      shift_roles sr on b.shift_role_id = sr.id join
      shifts s on sr.shift_id = s.id
    group by b.user_id`;
  
  const result = await client.query(wrap`
    select 
      u.id,
      concat_ws(' ', u.first_name, u.last_name) as name,
      u.image_id,
      ${select}
      json_agg(json_build_object('name', r.name, 'colour', r.colour)) as roles,
      json_agg(distinct a.name) as area_names,
      coalesce(s.booked, 0) as booked,
      coalesce(s.attended, 0) as attended,
      to_char(coalesce(s.attended_time, interval '0 hours'), 'HH24:MI') as attended_time
    from 
      user_areas ua join
      users u on ua.user_id = u.id join
      areas a on ua.area_id = a.id join
      roles r on ua.role_id = r.id left join
      (${shiftsQuery}) as s on s.user_id = u.id
    where
      u.organisation_id = ${organisationId}
      ${where}
    group by u.id, r.name, r.colour, s.booked, s.attended, s.attended_time
    ${having}
    order by u.last_name asc
    limit ${limit} offset ${offset}`);
  return result.rows[0].result;
}

const findPotentialBookings = async ({
  searchTerm,
  areaId,
  roleIds,
  shiftStartTime
}, organisationId, client = pool) => {
  searchTerm = `${searchTerm}%`;
  
  const result = await client.query(wrap`
    select
      u.id,
      concat_ws(' ', u.first_name, u.last_name) as name,
      r.id as role_id,
      r.name as role_name,
      u.image_id
    from
      user_areas ua join
      roles r on ua.role_id = r.id join
      users u on ua.user_id = u.id
    where
      concat_ws(' ', u.first_name, u.last_name) ilike ${searchTerm} and
      ua.role_id in (${roleIds}) and
      ua.area_id = ${areaId} and
      ua.start_time <= ${shiftStartTime} and
      (ua.end_time is null or ua.end_time > ${shiftStartTime}) and
      u.organisation_id = ${organisationId}
    limit 5`);
  return result.rows[0].result;
}

const updateImageByPrimaryField = async ({
  fileId,
  fieldName,
  fieldValue
}, overwrite, organisationId, client = pool) => {
  fieldName = sql`${fieldName}`;
  const result = await client.query(sql`
    update users u
    set image_id = ${fileId}
    where
      u.organisation_id = ${organisationId} and
      u.${fieldName} = ${fieldValue}
      ${overwrite ? sql`` : sql` and u.image_id is null`}`);
  return result;
}

const updateImageByCustomField = async ({
  fileId,
  fieldName,
  fieldValue
}, overwrite, organisationId, client = pool) => {
  const result = await client.query(`
    update users u
    set image_id = ${fileId}
    from 
      user_fields uf,
      fields f
    where
      uf.user_id = u.id and
      uf.field_id = f.id and
      u.organisation_id = ${organisationId} and
      f.name = ${fieldName} and
      uf.text_value = ${fieldValue}
      ${overwrite ? sql`` : sql` and u.image_id is null`}`);
  return result;
}

const resetFailedPasswordAttempts = async (userId, client = pool) => {
  await client.query(sql`
    update users
    set failed_password_attempts = 0
    where id = ${userId}`);
}

const incrementFailedPasswordAttempts = async (userId, client = pool) => {
  await client.query(sql`
    update users
    set 
      failed_password_attempts = failed_password_attempts + 1,
      is_disabled = case when 
        (failed_password_attempts + 1) = 5 then true
        else is_disabled end
    where
      id = ${userId} and
      is_disabled is false`);
}

const disable = async (userId, client = pool) => {
  await client.query(sql`
    update users
    set is_disabled = true
    where id = ${userId}`);
}

const enable = async (userId, client = pool) => {
  await client.query(sql`
    update users
    set is_disabled = false
    where id = ${userId}`);
}

const verify = async (userId, emailToken, client = pool) => {
  const result = await client.query(sql`
    update users
    set 
      is_verified = true,
      email_token = null,
      email_token_expiry = null
    where
      id = ${userId} and
      is_disabled is false and
      is_verified is false and
      email_token is not null and
      email_token = ${emailToken} and
      email_token_expiry > now()`);
  return result.rowCount === 1;
}

const getPassword = async (userId, client = pool) => {
  const result = await client.query(sql`
    select password from users 
    where id = ${userId}`);
  return result.rows[0].password;
}

const remove = async (userId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from users
    where 
      id = ${userId} and
      organisation_id = ${organisationId} and
      is_admin is false`);
  return result;
}

export default {
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
  findPotentialBookings,
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
