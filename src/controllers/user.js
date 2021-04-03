const getPool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const config = require('../../config');
const userRepository = require('../repositories/user');
const organisationRepository = require('../repositories/organisation');
const emailTemplateRepository = require('../repositories/emailTemplate');
const userAreaRepository = require('../repositories/userArea');
const mailer = require('../services/emailTemplate');
const populate = require('../database/populate');

const db = {
  users: userRepository,
  organisations: organisationRepository,
  emailTemplates: emailTemplateRepository,
  userAreas: userAreaRepository
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
      name: organisationName
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
    const rejected = await mailer.send('SignUp', [{
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
  const { users: suppliedUsers, emailTemplateId } = req.body;
  const organisationId = req.user.organisationId;
  const isAdmin = false;
  const users = [];
  const errorUsers = [];
  const client = await getPool().connect();
  for (const suppliedUser of suppliedUsers) {
    const {
      firstName,
      lastName,
      email,
      imageId,
      phone,
      pager,
      userAreas } = suppliedUser;
    if (!firstName || !lastName || !email || !email.includes('@') || userAreas.length === 0) {
      errorUsers.push({ firstName, lastName, email, error: 'validation' });
      continue;
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(uuid(), salt);
    const refreshToken = uuid();
    const emailToken = uuid();

    const user = {
      firstName,
      lastName,
      email,
      password: hash,
      refreshToken,
      emailToken,
      isAdmin,
      imageId,
      phone,
      pager
    };
    try {
      await client.query('begin');
      const userId = await db.users.insert(user, client);
      await db.users.addOrganisation(userId, organisationId, client);
      for (const userArea of userAreas) {
        await db.userAreas.insert({ ...userArea, userId }, organisationId, client);
      }
      await client.query('commit');
      users.push({ ...user, id: userId });
    }
    catch (e) {
      errorUsers.push({ firstName, lastName, email, error: 'database' });
      await client.query('rollback');
    }
  }
  client.release();
  const emailUsers = users.map(u => {
    return {
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      url: `https://${config.host}/invite/${u.id}/${u.emailToken}`
    }
  });
  const rejected = await mailer.send('Invite', emailUsers, emailTemplateId, organisationId);
  const rejectedEmails = new Set(rejected);
  const rejectedUsers = users
    .filter(u => rejectedEmails.has(u.email))
    .map(u => ({ 
      firstName: u.firstName, 
      lastName: u.lastName, 
      email: u.email, 
      error: 'email' 
    }));
  return res.json([...errorUsers, ...rejectedUsers]);
}

const resendInvitation = async (req, res) => {
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
  const rejected = await mailer.send('Invite', [emailUser], emailTemplateId, organisationId);
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
  await mailer.send('LostPassword', [emailUser], null, organisationId);
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
    password: suppliedPassword } = req.body;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const user = await db.users.getByEmail(email, client);
    if (!user) {
      await client.query('commit');
      return res.sendStatus(404);
    }
    const { password: storedPassword, ...tokenData } = user;
    const result = await bcrypt.compare(suppliedPassword, storedPassword);
    if (result) {
      if (user.failedPasswordAttempts !== 0) {
        await db.users.resetFailedPasswordAttempts(user.id, client);
        await client.query('commit');
      }
      const { token, expiry } = createToken(tokenData);
      const defaultView = user.roles && user.roles.length > 0 ? user.roles.filter(r => r.isPrimary)[0].defaultView : '';
      return res.json({ 
        token,
        expiry,
        defaultView,
        firstName: user.firstName,
        isAdmin: user.isAdmin });
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
    const user = await db.users.getByEmail(data.email);
    if (!user) {
      return res.sendStatus(404);
    }
    const { password, ...tokenData } = user;
    if (data.refreshToken === user.refreshToken) {
      const { token, expiry } = createToken(tokenData);
      const defaultView = user.roles && user.roles.length > 0 ? user.roles.filter(r => r.isPrimary)[0].defaultView : '';
      return res.json({ 
        token,
        expiry,
        defaultView,
        firstName: user.firstName,
        isAdmin: user.isAdmin });
    }
    return res.sendStatus(404);
  }
  catch (e) {
    return res.sendStatus(404);
  }
}

const createToken = (tokenData) => {
  const token = jwt.sign(tokenData, config.key, { expiresIn: '30 minutes' });
  const expiry = Date.now() + (1000 * 60 * 30);
  return { token, expiry };
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

    return res.json(token);
  }
  return res.sendStatus(401);
}

const find = async (req, res) => {
  const query = req.body;
  const user = req.user;
  const areaIds = user.isAdmin ? [] : user.areas.filter(a => a.isAdmin).map(a => a.id);
  const result = await db.users.find(query, user.isAdmin, areaIds, user.organisationId);
  return res.json(result);
}

const update = async (req, res) => {
  const user = req.body;
  await db.users.update(user, req.user.id);
  return res.sendStatus(200);
}

const changeImage = async (req, res) => {
  const userId = req.params.userId;
  const imageId = req.files[0].fileId;
  await db.users.changeImage(userId, imageId, req.user.organisationId);
}

const uploadImages = async (req, res) => {
  const images = req.files.map(f => {
    return {
      email: f.originalName,
      imageId: f.fileId
    };
  });
  const accepted = await db.users.updateImages(images, req.user.organisationId);
  return res.json(accepted);
}

const remove = async (req, res) => {
  const { userId } = req.body;
  await db.users.remove(userId, req.user.organisationId);
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
  find,
  update,
  changeImage,
  uploadImages,
  remove
};
