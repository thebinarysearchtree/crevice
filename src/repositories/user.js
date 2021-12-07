import pool from '../database/db.js';
import { makeReviver } from '../utils/data.js';
import sql from '../../sql';

const { users } = sql;

const reviver = makeReviver();

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
  const text = users.insert;
  const values = [
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
    organisationId];
  const result = await client.query(text, values);
  return result.rows[0].id;
}

const checkEmailExists = async (email, client = pool) => {
  const text = users.checkEmailExists;
  const values = [email];
  const result = await client.query(text, values);
  return result.rows[0].exists;
}

const getById = async (userId, organisationId, client = pool) => {
  const text = users.getById;
  const values = [userId, organisationId];
  const result = await client.query(text, values);
  return JSON.parse(result.rows[0].result, reviver)[0];
}

const setEmailToken = async (email, emailToken, client = pool) => {
  const text = users.setEmailToken;
  const values = [email, emailToken];
  const result = await client.query(text, values);
  const { id: userId, first_name: firstName } = result.rows[0];
  return { userId, firstName };
}

const getByEmail = async (email, client = pool) => {
  const text = users.getByEmail;
  const values = [email];
  const result = await client.query(text, values);
  return JSON.parse(result.rows[0].result, reviver)[0];
}

const getUserDetails = async (userId, organisationId, client = pool) => {
  const text = users.getUserDetails;
  const values = [userId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getTasks = async (organisationId, client = pool) => {
  const text = users.getTasks;
  const values = [organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getRefreshToken = async (userId, client = pool) => {
  const text = users.getRefreshToken;
  const values = [userId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const changePassword = async (hash, refreshToken, userId, client = pool) => {
  const text = users.changePassword;
  const values = [hash, refreshToken, userId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const changePasswordWithToken = async (userId, emailToken, hash, client = pool) => {
  const text = users.changePasswordWithToken;
  const values = [userId, emailToken, hash];
  const result = await client.query(text, values);
  return result.rowCount === 1;
}

const find = async ({
  searchTerm,
  roleId,
  areaId,
  page,
  count
}, isAdmin, areaIds, organisationId, client = pool) => {
  if (searchTerm) {
    searchTerm = `%${searchTerm}%`;
  }
  const limit = 10;
  const offset = limit * page;
  const getCount = page === 0 || count === null;
  const text = users.find;
  const values = [
    searchTerm, 
    roleId, 
    areaId, 
    getCount,
    isAdmin,
    areaIds,
    limit, 
    offset, 
    organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const findPotentialBookings = async ({
  searchTerm,
  areaId,
  roleIds,
  shiftStartTime,
  bookedUserIds
}, organisationId, client = pool) => {
  searchTerm = `%${searchTerm}%`;
  const text = users.findPotentialBookings;
  const values = [
    searchTerm, 
    areaId, 
    roleIds, 
    shiftStartTime, 
    bookedUserIds, 
    organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const findByName = async (searchTerm, organisationId, client = pool) => {
  searchTerm = `%${searchTerm}%`;

  const results = await client.query(wrap`
    select
      id,
      concat_ws(' ', first_name, last_name) as name,
      image_id
    from users
    where
      concat_ws(' ', first_name, last_name) ilike ${searchTerm} and
      organisation_id = ${organisationId}
    limit 5`);
  return results.rows[0].result;
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
  const result = await client.query(sql`
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
  findByName,
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
