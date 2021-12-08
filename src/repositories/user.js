import pool from '../database/db.js';
import { makeReviver } from '../utils/data.js';
import sql from '../../sql.js';

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
  const text = users.findByName;
  const values = [searchTerm, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const updateImageByPrimaryField = async ({
  fileId,
  fieldName,
  fieldValue
}, overwrite, organisationId, client = pool) => {
  const text = users.updateImage;
  const values = [
    fileId, 
    fieldName, 
    fieldValue, 
    overwrite, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const updateImageByCustomField = async ({
  fileId,
  fieldName,
  fieldValue
}, overwrite, organisationId, client = pool) => {
  const text = users.updateImageByField;
  const values = [
    fileId, 
    fieldName, 
    fieldValue, 
    overwrite, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const resetFailedPasswordAttempts = async (userId, client = pool) => {
  const text = users.resetAttempts;
  const values = [userId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const incrementFailedPasswordAttempts = async (userId, client = pool) => {
  const text = users.incrementAttempts;
  const values = [userId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const disable = async (userId, client = pool) => {
  const text = users.disable;
  const values = [userId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const enable = async (userId, client = pool) => {
  const text = users.enable;
  const values = [userId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const verify = async (userId, emailToken, client = pool) => {
  const text = users.verify;
  const values = [userId, emailToken];
  const result = await client.query(text, values);
  return result.rowCount === 1;
}

const getPassword = async (userId, client = pool) => {
  const text = users.getPassword;
  const values = [userId];
  const result = await client.query(text, values);
  const parsed = JSON.parse(result.rows[0].result);
  return parsed[0].password;
}

const remove = async (userId, organisationId, client = pool) => {
  const text = users.remove;
  const values = [userId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
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
