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
      isAdmin,
      organisationId)
    values($1, $2, $3, $4, $5, $6, $7, $8)
    returning id`, [
      firstName,
      lastName,
      email,
      password,
      refreshToken,
      emailToken,
      isAdmin,
      organisationId]);
  return result.rows[0].id;
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
    select 
      u.id,
      u.firstName as "firstName",
      u.lastName as "lastName,
      u.email,
      u.password,
      u.refreshToken as "refreshToken",
      u.isAdmin as "isAdmin",
      o.organisationId as "organisationId"
    from 
      users u,
      userOrganisations o
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
  addOrganisation,
  checkEmailExists,
  getByEmail,
  getRefreshToken,
  changePassword,
  update,
  getPassword,
  deleteById
};
