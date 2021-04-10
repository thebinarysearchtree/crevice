const getPool = require('../database/db');
const fieldRepository = require('../repositories/field');

const db = {
  fields: fieldRepository
};

const insertSelect = async (field, organisationId, client) => {
  const fieldId = await db.fields.insert(field, organisationId, client);
  for (const item of field.selectItems) {
    const { name, itemNumber } = item;
    await db.fields.insertSelectItem({ fieldId, name, itemNumber }, organisationId, client);
  }
}

const insertGroup = async (fieldGroup, organisationId, client) => {
  const { name, fields } = fieldGroup;
  const groupId = await db.fields.insertGroup(name, organisationId, client);
  for (const field of fields) {
    if (field.fieldType === 'Select') {
      await insertSelect({...field, groupId }, organisationId)
    }
    else {
      await db.fields.insert({...field, groupId }, organisationId, client);
    }
  }
  return groupId;
}

const insert = async (req, res) => {
  const field = req.body;
  const { fieldType } = field;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    if (fieldType === 'Select') {
      await insertSelect(field, organisationId, client);
    }
    else if (fieldType === 'Multiple fields') {
      await insertGroup(field, organisationId, client);
    }
    else {
      await db.fields.insert(field, organisationId, client);
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

const update = async (req, res) => {
  const field = req.body;
  await db.fields.update(field, req.user.organisationId);
  return res.sendStatus(200);
}

const updateGroup = async (req, res) => {
  const fieldGroup = req.body;
  await db.fields.updateGroup(fieldGroup, req.user.organisationId);
  return res.sendStatus(200);
}

const getById = async (req, res) => {
  const { fieldId, fieldType } = req.body;
  const fields = await db.fields.getById(fieldId, fieldType, req.user.organisationId);
  return res.json(fields);
}

const getAllFields = async (req, res) => {
  const fields = await db.fields.getAllFields(req.user.organisationId);
  return res.json(fields);
}

const getSelectListItems = async (req, res) => {
  const selectListItems = await db.fields.getSelectListItems(req.user.organisationId);
  return res.json(selectListItems);
}

const find = async (req, res) => {
  const fields = await db.fields.find(req.user.organisationId);
  return res.json(fields);
}

const remove = async (req, res) => {
  const { fieldId } = req.body;
  await db.fields.remove(fieldId, req.user.organisationId);
  return res.sendStatus(200);
}

const removeGroup = async (req, res) => {
  const { fieldGroupId } = req.body;
  await db.fields.removeGroup(fieldGroupId, req.user.organisationId);
  return res.sendStatus(200);
}

module.exports = {
  insert,
  insertGroup,
  update,
  updateGroup,
  getById,
  getAllFields,
  getSelectListItems,
  find,
  remove,
  removeGroup
};
