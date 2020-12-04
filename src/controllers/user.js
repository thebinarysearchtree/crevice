const getPool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const config = require('../../config');
const userRepository = require('../repositories/user');
const organisationRepository = require('../repositories/organisation');

const db = {
  users: userRepository,
  organisations: organisationRepository
};

const signUp = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    organisationName,
    password } = req.body;
  if (!firstName || !lastName || !email || username || !email.includes('@') || !password.length >= 6) {
    return res.sendStatus(400);
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const organisationId = await db.organisations.insert({
      organisationName
    });
    const isAdmin = true;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const refreshToken = uuid();
    const emailToken = null;

    const user = {
      firstName,
      lastName,
      email,
      password: hash,
      refreshToken,
      emailToken,
      isAdmin,
      organisationId
    };

    const userId = await db.users.insert(user, client);
    await db.users.addOrganisation(userId, organisationId, client);
    await client.query('commit');
    const token = createToken({
      id: userId,
      firstName,
      lastName,
      email,
      refreshToken,
      isAdmin,
      organisationId
    });
    return res.json({ token });
  }
  catch (e) {
    await client.query('rollback');
    return res.sendStatus(500);
  }
  finally {
    client.release();
  }
}

const checkEmailExists = async (req, res) => {
  const { email } = req.body;
  const exists = await db.users.checkEmailExists(email);
  return res.json({ exists });
}

const getToken = async (req, res) => {
  const {
    email,
    password: suppliedPassword } = req.body;
  const organisationId = req.baseUrl.slice(1);
  const user = await db.users.getByEmail(email, organisationId);
  if (!user) {
    return res.sendStatus(404);
  }
  const {
    password: storedPassword,
    ...tokenData } = user;
  const result = await bcrypt.compare(suppliedPassword, storedPassword);
  if (result) {
    const token = createToken(tokenData);
    return res.json({ token });
  }
  return res.sendStatus(401);
}

const refreshToken = async (req, res) => {
  const expiredToken = req.body.token;
  try {
    const data = jwt.verify(expiredToken, config.key, { ignoreExpiration: true });
    const refreshToken = await db.users.getRefreshToken(data.id);
    if (data.refreshToken === refreshToken) {
      const token = createToken(data);
      return res.json({ token });
    }
    return res.sendStatus(404);
  }
  catch (e) {
    return res.sendStatus(404);
  }
}

const createToken = (tokenData) => {
  return jwt.sign(tokenData, config.key, { expiresIn: '15 minutes' });
}

const changePassword = async (req, res) => {
  const { existingPassword: suppliedPassword, newPassword } = req.body;
  const storedPassword = await db.users.getPassword(req.user.id);
  const result = await bcrypt.compare(suppliedPassword, storedPassword);
  if (result) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    const refreshToken = uuid();
    await db.users.changePassword(hash, refreshToken, user.id);
    req.user.refreshToken = refreshToken;
    const token = createToken(req.user);

    return res.json({ token });
  }
  return res.sendStatus(401);
}

const update = async (req, res) => {
  const user = req.body;
  await db.users.update(user, req.user.id);
  return res.sendStatus(200);
}

const deleteUser = async (req, res) => {
  const { userId } = req.body;
  await db.users.deleteById(userId, req.user.organisationId);
  return res.sendStatus(200);
}

module.exports = {
  signUp,
  checkEmailExists,
  getToken,
  refreshToken,
  changePassword,
  update,
  deleteUser
};
