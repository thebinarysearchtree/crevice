import { pool, db } from '../database/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import config from '../../config.js';
import mailer from '../services/emailTemplate.js';
import populate from '../database/populate.js';
import parseCSV from 'csv-parse';
import { readFile } from 'fs/promises';
import path from 'path';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';

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
  const client = await pool.connect();
  try {
    await client.query('begin');
    const organisationId = await db.value(sql.organisations.insert, [organisationName], client);
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

    const userId = await db.value(sql.users.insert, [...Object.values(user), organisationId], client);
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
  const client = await pool.connect();
  try {
    await client.query('begin');
    const verified = await db.value(sql.users.verify, [userId, emailToken], client);
    if (!verified) {
      await db.empty(sql.users.incrementAttempts, [userId], client);
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

const parse = (content) => {
  const records = [];
  const parser = parseCSV();
  parser.on('readable', () => {
    let record;
    while (record = parser.read()) {
      records.push(record);
    }
  });
  parser.on('error', (err) => {
    throw err;
  });
  parser.write(content);
  parser.end();

  return records;
}

const transformCsv = async (fileInfo, userAreas, organisationId) => {
  const file = await db.first(sql.files.getById, [fileInfo.fileId, organisationId]);
  const content = await readFile(`${config.upload.filesDir}/${file.filename}`);
  let records;
  try {
    records = parse(content);
  }
  catch (e) {
    throw new Error('Invalid csv file');
  }
  const header = records[0];
  const requiredFieldNames = ['First name', 'Last name', 'Email'];
  for (const field of requiredFieldNames) {
    if (!header.includes(field)) {
      throw new Error(`The header is missing ${field}`);
    }
  }
  const optionalFieldNames = ['Phone', 'Pager'];
  const customFields = await db.rows(sql.fields.getCsvFields, [organisationId]);
  const customFieldNames = customFields.map(f => f.name);
  const allFields = [...requiredFieldNames, ...optionalFieldNames, ...customFieldNames];
  for (const column of header) {
    if (!allFields.includes(column)) {
      throw new Error(`${column} is not a valid field name`);
    }
  }
  const requiredFields = [];
  const optionalFields = [];
  const includedCustomFields = [];
  const displayNameMap = {
    'First name': 'firstName',
    'Last name': 'lastName',
    'Email': 'email',
    'Phone': 'phone',
    'Pager': 'pager'
  };
  for (const field of requiredFieldNames) {
    const index = header.indexOf(field);
    const name = displayNameMap[field];
    requiredFields.push({ name, index });
  }
  for (const field of optionalFieldNames) {
    const index = header.indexOf(field);
    if (index !== -1) {
      const name = displayNameMap[field];
      optionalFields.push({ name, index });
    }
  }
  for (const field of customFields) {
    const index = header.indexOf(field.name);
    if (index !== -1) {
      includedCustomFields.push({ field, index });
    }
  }
  const users = [];
  const rows = records.slice(1);
  let i = 1;
  for (const row of rows) {
    const user = {
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      pager: null,
      userAreas,
      userFields: []
    };
    for (const field of requiredFields) {
      const value = row[field.index];
      if (!value) {
        throw new Error(`Row ${i} is missing a value for the ${field.name} field`);
      }
      user[field.name] = value;
    }
    for (const field of optionalFields) {
      const value = row[field.index];
      user[field.name] = value;
    }
    for (const field of includedCustomFields) {
      const { field: fieldInfo, index } = field;
      const { id: fieldId, name: fieldName, fieldType, selectItems } = fieldInfo;
      const value = row[index];
      if (value) {
        if (fieldType === 'Select') {
          const selectItem = selectItems.find(item => item.name === value);
          if (!selectItem) {
            throw new Error(`Invalid value for the ${fieldName} field on row ${i}`);
          }
          user.userFields.push({
            fieldId,
            itemId: selectItem.id,
            textValue: null,
            dateValue: null
          });
        }
        else {
          user.userFields.push({
            fieldId,
            itemId: null,
            textValue: value,
            dateValue: null
          });
        }
      }
    }
    users.push(user);
    i++;
  }
  return users;
}

const inviteUsers = async (req, res) => {
  let { 
    users: suppliedUsers,
    fileInfo,
    userAreas,
    emailTemplateId } = req.body;
  if (fileInfo) {
    try {
      suppliedUsers = await transformCsv(fileInfo, userAreas, req.user.organisationId);
    }
    catch (e) {
      return res.json([{ type: 'parse', message: e.message }]);
    }
  }
  const organisationId = req.user.organisationId;
  const isAdmin = false;
  const users = [];
  const errorUsers = [];
  const client = await pool.connect();
  for (const suppliedUser of suppliedUsers) {
    const {
      firstName,
      lastName,
      email,
      imageId,
      phone,
      pager,
      userAreas,
      userFields } = suppliedUser;
    if (!firstName || !lastName || !email || !email.includes('@') || userAreas.length === 0) {
      errorUsers.push({ 
        type: 'validation', 
        message: `The user ${firstName} ${lastName} with email ${email} is missing a required field or has no areas` 
      });
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
      const userId = await db.value(sql.users.insert, [
        ...Object.values(user), 
        organisationId
      ], client);
      const promises = [];
      for (const userArea of userAreas) {
        const promise = db.empty(sql.userAreas.insert, [
          ...Object.values(userArea), 
          userId, 
          organisationId
        ], client);
        promises.push(promise);
      }
      for (const userField of userFields) {
        const { itemId, textValue, dateValue } = userField;
        if (!itemId && !textValue && !dateValue) {
          throw new Error();
        }
        const promise = db.empty(sql.userFields.insert, [
          ...Object.values(userField), 
          userId, 
          organisationId
        ], client);
        promises.push(promise);
      }
      await Promise.all(promises);
      await client.query('commit');
      users.push({ ...user, id: userId });
    }
    catch (e) {
      errorUsers.push({ 
        type: 'database', 
        message: `Could not insert user ${firstName} ${lastName} with email ${email}` 
      });
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
      type: 'email',
      message: `Failed trying to send an email to ${u.email}`
    }));
  return res.json([...errorUsers, ...rejectedUsers]);
}

const resendInvitation = async (req, res) => {
  const { userId, emailTemplateId } = req.body;
  const user = await db.first(sql.users.getById, [
    userId, 
    req.user.organisationId
  ]);
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
  const { id: userId, firstName } = await db.first(sql.users.setEmailToken, [
    email, 
    uuid()
  ]);
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
  const client = pool.connect();
  try {
    await client.query('begin');
    const rowCount = await db.rowCount(sql.users.changePasswordWithToken, [
      userId, 
      emailToken, 
      hash
    ], client);
    if (rowCount === 0) {
      await db.empty(sql.users.incrementAttempts, [userId], client);
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

const getToken = async (req, res) => {
  const {
    email,
    password: suppliedPassword } = req.body;
  const client = await pool.connect();
  try {
    await client.query('begin');
    const user = await db.first(sql.users.getByEmail, [email], client);
    if (!user) {
      await client.query('commit');
      return res.sendStatus(404);
    }
    const { password: storedPassword, ...tokenData } = user;
    const result = await bcrypt.compare(suppliedPassword, storedPassword);
    if (result) {
      if (user.failedPasswordAttempts !== 0) {
        await db.empty(sql.users.resetAttempts, [user.id], client);
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
      await db.empty(sql.users.incrementAttempts, [user.id], client);
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
    const user = await db.first(sql.users.getByEmail, [data.email]);
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
  const userId = req.user.id;
  const storedPassword = await db.value(sql.users.getPassword, [userId]);
  const result = await bcrypt.compare(suppliedPassword, storedPassword);
  if (result) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    const refreshToken = uuid();
    await db.empty(sql.users.changePassword, [hash, refreshToken, userId]);
    req.user.refreshToken = refreshToken;
    const token = createToken(req.user);

    return res.json(token);
  }
  return res.sendStatus(401);
}

const find = async (req, res) => {
  const {
    searchTerm,
    roleId,
    areaId,
    page,
    count
  } = req.body;
  if (searchTerm) {
    searchTerm = `%${searchTerm}%`;
  }
  const limit = 10;
  const offset = limit * page;
  const getCount = page === 0 || count === null;
  const user = req.user;
  const isAdmin = user.isAdmin;
  const organisationId = user.organisationId;
  const areaIds = user.isAdmin ? [] : user.areas.filter(a => a.isAdmin).map(a => a.id);
  const result = await db.rows(sql.users.find, [
    searchTerm, 
    roleId, 
    areaId, 
    getCount,
    isAdmin,
    areaIds,
    limit, 
    offset, 
    organisationId
  ]);
  return res.send(result);
}

const changeImage = async (req, res) => {
  const userId = req.params.userId;
  const imageId = req.files[0].fileId;
  await db.users.changeImage(userId, imageId, req.user.organisationId);
}

const updateImages = async (req, res) => {
  const { files, fieldName, overwrite } = req.body;
  const isUserField = ['Email', 'Phone'].includes(fieldName);
  const promises = [];
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const file of files) {
      const { fileId, originalName } = file;
      const fieldValue = path.parse(originalName).name;
      const params = [
        fileId, 
        fieldName.toLowerCase(), 
        fieldValue, 
        overwrite, 
        req.user.organisationId
      ];
      let promise;
      if (isUserField) {
        promise = db.result(sql.users.updateImage, params, client);
      }
      else {
        promise = db.result(sql.users.updateImageByField, params, client);
      }
      promises.push(promise);
    }
    const results = await Promise.all(promises);
    await client.query('commit');
    const error = overwrite ? 'No matching user found' : 'No matching user found or user already has a profile photo';
    const errors = results.reduce((a, c, i) => {
      if (c.rowCount === 0) {
        a.push({ originalName: files[i].originalName, error });
      }
      return a;
    }, []);
    return res.json(errors);
  }
  catch (e) {
    await client.query('rollback');
    return res.sendStatus(500);
  }
  finally {
    client.release();
  }
}

const middleware = [auth, admin];

const searchTerm = (req) => {
  const query = req.body;
  query.searchTerm = `%${query.searchTerm}%`;
  return [...Object.values(query), req.user.organisationId];
}

const wrap = true;
const users = sql.users;

const routes = [
  {
    handler: signUp,
    route: '/users/signUp'
  },
  {
    handler: verify,
    route: '/users/verify'
  },
  {
    handler: inviteUsers,
    route: '/users/invite',
    middleware
  },
  {
    handler: resendInvitation,
    route: '/users/resentInvitation',
    middleware
  },
  {
    handler: lostPassword,
    route: '/users/lostPassword'
  },
  {
    handler: changePasswordWithToken,
    route: '/users/changePasswordWithToken'
  },
  {
    handler: getToken,
    route: '/users/getToken'
  },
  {
    handler: refreshToken,
    route: '/users/refreshToken'
  },
  {
    handler: changePassword,
    route: '/users/changePassword',
    middleware: auth
  },
  {
    handler: find,
    route: '/users/find',
    middleware: auth
  },
  {
    handler: changeImage,
    route: '/users/changeImage',
    middleware
  },
  {
    handler: updateImages,
    route: '/users/updateImages',
    middleware
  },
  {
    sql: users.findPotentialBookings,
    params: searchTerm,
    route: '/users/findPotentialBookings',
    middleware: auth,
    wrap
  },
  {
    sql: users.findByName,
    params: searchTerm,
    route: '/users/findByName',
    middleware: auth,
    wrap
  },
  {
    sql: users.getUserDetails,
    params,
    route: '/users/getUserDetails',
    middleware,
    wrap
  },
  {
    sql: users.remove,
    params,
    route: '/users/remove',
    middleware
  }
];

add(routes);
