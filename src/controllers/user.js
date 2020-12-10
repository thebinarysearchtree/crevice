const getPool = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuid = require('uuid/v4');
const config = require('../../config');
const userRepository = require('../repositories/user');
const organisationRepository = require('../repositories/organisation');
const emailTemplateRepository = require('../repositories/emailTemplate');
const mailer = require('../services/email');

const db = {
  users: userRepository,
  organisations: organisationRepository,
  emailTemplates: emailTemplateRepository
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
    const emailToken = uuid();

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

    const url = `https://${config.host}/invite/${userId}/${emailToken}`;
    const subject = 'Welcome to crevice';
    const plaintext = `
      Hi ${firstName}, 
      Click this link to finish the signup process: ${url}`;
    const html = `<p>${plaintext}</p>`;

    const result = await mailer.send({
      to: email,
      subject,
      text: plaintext,
      html
    });
    return res.json(result.rejected);
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
  const [userId, emailToken] = req.path.slice(1).split('/');
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

const makeInvitationEmail = ({
  template,
  userId,
  firstName,
  lastName,
  emailToken
}) => {
  const url = `https://${config.host}/invite/${userId}/${emailToken}`;
  let subject, plaintext, html;
  if (template) {
    subject = template.subject;
    plaintext = template.plaintext
      .replace(/{firstName}/, firstName)
      .replace(/{lastName}/, lastName)
      .replace(/{url}/, url);
    html = template.html
      .replace(/{firstName}/, firstName)
      .replace(/{lastName}/, lastName)
      .replace(/{url}/, url);
  }
  else {
    subject = 'Welcome to crevice';
    plaintext = `
      Hi ${firstName}, you have been invited to join Crevice. 
      Click this link to finish the process: ${url}`;
    html = `<p>${plaintext}</p>`;
  }
  return {
    subject,
    plaintext,
    html
  };
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
  const promises = [];
  let template;
  if (emailTemplateId) {
    template = await db.emailTemplates.getById(emailTemplateId, organisationId);
  }
  for (const storedUser of storedUsers) {
    const {
      email: to,
      id: userId,
      emailToken,
      firstName,
      lastName } = storedUser;
    const { subject, plaintext, html } = makeInvitationEmail({
      template,
      userId,
      firstName,
      lastName,
      emailToken
    });
    const promise = mailer.send({
      to,
      subject,
      text: plaintext,
      html
    });
    promises.push(promise);
  }
  const results = await Promise.all(promises);
  const rejectedEmails = results.flatMap(r => r.rejected);
  
  return res.json(rejectedEmails);
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
  const {
    firstName,
    lastName,
    email: to,
    emailToken
  } = user;
  let template;
  if (emailTemplateId) {
    template = await db.emailTemplates.getById(emailTemplateId, req.user.organisationId);
  }
  const { subject, plaintext, html } = makeInvitationEmail({
    template,
    userId,
    firstName,
    lastName,
    emailToken
  });
  const result = await mailer.send({
    to,
    subject,
    text: plaintext,
    html
  });
  return res.json(result.rejected);
}

const lostPassword = async (req, res) => {
  const { email } = req.body;
  const userId = await db.users.setEmailToken(email, uuid());
  const url = `https://${config.host}/lostpassword/${userId}/${emailToken}`;
  const subject = 'Lost password';
  const plaintext = `
    Hi ${firstName}, 
    Click this link to reset your password: ${url}`;
  const html = `<p>${plaintext}</p>`;

  await mailer.send({
    to: email,
    subject,
    text: plaintext,
    html
  });
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
  const organisationId = req.baseUrl.slice(1);
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const user = await db.users.getByEmail(email, organisationId, client);
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
      return res.json({ token });
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

const deleteUser = async (req, res) => {
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
  deleteUser
};
