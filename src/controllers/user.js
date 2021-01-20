const getPool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const config = require('../../config');
const userRepository = require('../repositories/user');
const organisationRepository = require('../repositories/organisation');
const emailTemplateRepository = require('../repositories/emailTemplate');
const mailer = require('../services/emailTemplate');
const populate = require('../database/populate');

const db = {
  users: userRepository,
  organisations: organisationRepository,
  emailTemplates: emailTemplateRepository
};

const signUp = async (req, res) => {
  const {
    organisationName,
    firstName,
    lastName,
    email,
    password } = req.body;
  if (!organisationName || !firstName || !lastName || !email || !email.includes('@') || !password.length >= 6) {
    return res.sendStatus(400);
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const organisationId = await db.organisations.insert({
      organisationName
    }, client);
    await populate(organisationId, client);
    const isAdmin = true;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const refreshToken = uuid();
    const emailToken = uuid();

    const user = {
      firstName,
      lastName,
      email,
      password: hash,
      refreshToken,
      emailToken,
      isAdmin
    };

    const userId = await db.users.insert(user, client);
    await db.users.addOrganisation(userId, organisationId, client);
    await client.query('commit');

    const url = `https://${config.host}/invite/${userId}/${emailToken}`;
    const rejected = await mailer.send('signup', [{
      firstName,
      email,
      url
    }], null, organisationId);

    if (rejected.length === 0) {
      return res.sendStatus(200);
    }
    return res.sendStatus(500);
  }
  catch (e) {
    await client.query('rollback');
    return res.sendStatus(500);
  }
  finally {
    client.release();
  }
}

const verify = async (req, res) => {
  const { userId, emailToken } = req.body;
  if (!userId || !emailToken) {
    return res.sendStatus(404);
  }
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const verified = await db.users.verify(userId, emailToken, client);
    if (!verified) {
      await db.users.incrementFailedPasswordAttempts(userId, client);
      await client.query('commit');
      return res.sendStatus(401);
    }
    await client.query('commit');
    return res.sendStatus(200);
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
  const { suppliedUsers, tagId, emailTemplateId } = req.body;
  const organisationId = req.user.organisationId;
  const isAdmin = false;
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
  const emailUsers = storedUsers.map(u => {
    return {
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      url: `https://${config.host}/invite/${u.id}/${u.emailToken}`
    }
  });
  const rejected = await mailer.send('invite', emailUsers, emailTemplateId, organisationId);
  return res.json(rejected);
}

const resendInvitation = async (req, res) => {
  if (!req.user.isAdmin) {
    const canInvite = req.user.roles.includes(r => r.canInviteUsers);
    if (!canInvite) {
      return res.sendStatus(401);
    }
  }
  const { userId, emailTemplateId } = req.body;
  const user = await db.users.getById(userId, req.user.organisationId);
  if (!user || user.isDisabled) {
    return res.sendStatus(404);
  }
  const emailUser = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    url: `https://${config.host}/invite/${userId}/${user.emailToken}`
  }
  const rejected = await mailer.send('invite', [emailUser], emailTemplateId, organisationId);
  return res.json(rejected);
}

const lostPassword = async (req, res) => {
  const { email, organisationId } = req.body;
  const { id: userId, firstName } = await db.users.setEmailToken(email, uuid());
  const url = `https://${config.host}/lostpassword/${userId}/${emailToken}`;
  const emailUser = {
    email,
    firstName,
    url
  };
  await mailer.send('lostPassword', [emailUser], null, organisationId);
  return res.sendStatus(200);
}

const changePasswordWithToken = async (req, res) => {
  const { userId, emailToken, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const client = getPool().connect();
  try {
    await client.query('begin');
    const result = await db.users.changePasswordWithToken(userId, emailToken, hash, client);
    if (!result) {
      await db.users.incrementFailedPasswordAttempts(userId, client);
      await client.query('commit');
      return res.sendStatus(401);
    }
    await client.query('commit');
    return res.sendStatus(200);
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
    password: suppliedPassword,
    organisationId } = req.body;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const user = await db.users.getByEmail(email, null, client);
    if (!user || user.isDisabled || !user.isVerified) {
      await client.query('commit');
      return res.sendStatus(404);
    }
    const {
      password: storedPassword,
      isDisabled,
      isVerified,
      ...tokenData } = user;
    const result = await bcrypt.compare(suppliedPassword, storedPassword);
    if (result) {
      if (user.failedPasswordAttempts !== 0) {
        await db.users.resetFailedPasswordAttempts(user.id, client);
        await client.query('commit');
      }
      const token = createToken(tokenData);
      let tasks;
      if (user.isAdmin) {
        tasks = await db.users.getTasks(organisationId, client);
      }
      const defaultView = user.roles.length > 0 ? user.roles.filter(r => r.isPrimary)[0].defaultView : '';
      return res.json({ 
        token,
        tasks,
        defaultView,
        firstName: user.firstName });
    }
    else {
      await db.users.incrementFailedPasswordAttempts(user.id, client);
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
    if (!user || user.isDisabled || !user.isVerified) {
      return res.sendStatus(404);
    }
    const {
      password,
      isDisabled,
      isVerified,
      ...tokenData } = user;
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

const changeImage = async (req, res) => {
  const userId = req.params.userId;
  if (!req.user.isAdmin) {
    const canChangeImage = req.user.roles.includes(r => r.canChangeImage);
    if (!canChangeImage || userId !== req.user.id) {
      return res.sendStatus(401);
    }
  }
  const imageId = req.files[0].fileId;
  await db.users.changeImage(userId, imageId, req.user.organisationId);
}

const uploadImages = async (req, res) => {
  if (!req.user.isAdmin) {
    return res.sendStatus(401);
  }
  const images = req.files.map(f => {
    return {
      email: f.originalName,
      imageId: f.fileId
    };
  });
  const accepted = await db.users.updateImages(images, req.user.organisationId);
  return res.json(accepted);
}

const deleteUser = async (req, res) => {
  if (!req.user.isAdmin) {
    return res.sendStatus(401);
  }
  const { userId } = req.body;
  await db.users.deleteById(userId, req.user.organisationId);
  return res.sendStatus(200);
}

module.exports = {
  signUp,
  verify,
  inviteUsers,
  resendInvitation,
  lostPassword,
  changePasswordWithToken,
  checkEmailExists,
  getToken,
  refreshToken,
  changePassword,
  update,
  changeImage,
  uploadImages,
  deleteUser
};
