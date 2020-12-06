const getPool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const config = require('../../config');
const userRepository = require('../repositories/user');
const organisationRepository = require('../repositories/organisation');
const mailer = require('../services/email');

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
  if (!firstName || !lastName || !email || !email.includes('@') || !password.length >= 6) {
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

    const user = {
      firstName,
      lastName,
      email,
      password: hash,
      refreshToken,
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

const inviteUsers = async (req, res) => {
  if (!req.user.isAdmin) {
    const canInvite = req.user.roles.includes(r => r.canInviteUsers);
    if (!canInvite) {
      return res.sendStatus(401);
    }
  }
  const { suppliedUsers, tagId } = req.body;
  const organisationId = req.user.organisationId;
  const isAdmin = false;
  const emailTokenExpiry = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));
  const users = [];
  for (const suppliedUser of suppliedUsers) {
    const {
      firstName,
      lastName,
      email,
      imageId } = suppliedUser;
    if (!firstName || !lastName || !email || !email.includes('@')) {
      return res.sendStatus(400);
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(uuid(), salt);
    const refreshToken = uuid();
    const emailToken = uuid();

    users.push({
      firstName,
      lastName,
      email,
      password: hash,
      refreshToken,
      emailToken,
      emailTokenExpiry,
      isAdmin,
      imageId
    });
  }
  const storedUsers = await db.users.insertMany(users, tagId, organisationId);
  const promises = [];
  for (const storedUser of storedUsers) {
    const { email: to, id: userId, emailToken, firstName } = storedUser;
    const url = `https://${config.host}/invite/${userId}/${emailToken}`;
    const message = `
      Hi ${firstName}, you have been invited to join Crevice. 
      Click this link to finish the process: ${url}`;
    const promise = mailer.send({
      to,
      subject: 'Welcome to crevice',
      text: message,
      html: `<p>${message}</p>`
    });
    promises.push(promise);
  }
  await Promise.all(promises);
}

const resendInvitation = async (req, res) => {

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
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const user = await db.users.getByEmail(email, organisationId, client);
    if (!user || user.isDisabled) {
      await client.query('commit');
      return res.sendStatus(404);
    }
    const {
      password: storedPassword,
      ...tokenData } = user;
    const result = await bcrypt.compare(suppliedPassword, storedPassword);
    if (result) {
      if (user.failedPasswordAttempts !== 0) {
        await db.users.updateFailedPasswordAttempts(user.id, 0, client);
        await client.query('commit');
      }
      const token = createToken(tokenData);
      return res.json({ token });
    }
    else {
      const failedPasswordAttempts = user.failedPasswordAttempts + 1;
      await db.users.updateFailedPasswordAttempts(user.id, failedPasswordAttempts, client);
      if (failedPasswordAttempts === 5) {
        await db.users.disable(user.id, client);
      }
      await client.query('commit');
    }
    return res.sendStatus(401);
  }
  catch (e) {
    await client.query('rollback');
    return res.sendStatus(500);
  }
  finally {
    client.release();
  }
}

const refreshToken = async (req, res) => {
  const expiredToken = req.body.token;
  try {
    const data = jwt.verify(expiredToken, config.key, { ignoreExpiration: true });
    const user = await db.users.getByEmail(data.email, data.organisationId);
    const { password, ...tokenData } = user;
    if (data.refreshToken === user.refreshToken) {
      const token = createToken(tokenData);
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
  inviteUsers,
  checkEmailExists,
  getToken,
  refreshToken,
  changePassword,
  update,
  deleteUser
};
