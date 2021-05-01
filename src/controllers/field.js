const getPool = require('../database/db');
const fieldRepository = require('../repositories/field');
const fieldItemRepository = require('../repositories/fieldItem');

const db = {
  fields: fieldRepository,
  fieldItems: fieldItemRepository
};

const insertSelect = async (field, organisationId, client) => {
  const fieldId = await db.fields.insert(field, organisationId, client);
  const promises = [];
  for (const item of field.selectItems) {
    const { name, itemNumber } = item;
    const promise = db.fieldItems.insert({ fieldId, name, itemNumber }, organisationId, client);
    promises.push(promise);
  }
  await Promise.all(promises);
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
  const { fieldId, name, existingName, itemsToDelete, itemsToAdd, itemsToUpdate } = req.body;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const field = await db.fields.getById(fieldId, organisationId, client);
    if (name !== existingName) {
      await db.fields.update(fieldId, name, organisationId, client);
    }
    if (field.fieldType === 'Select') {
      const existingItemIds = field.selectItems.map(i => i.id);
      const promises = [];
      for (const item of itemsToDelete) {
        if (existingItemIds.includes(item.id)) {
          const promise = db.fieldItems.remove(item.id, organisationId, client);
          promises.push(promise);
        }
      }
      for (const item of itemsToAdd) {
        const promise = db.fieldItems.insert({...item, fieldId }, organisationId, client);
        promises.push(promise);
      }
      for (const item of itemsToUpdate) {
        if (existingItemIds.includes(item.id)) {
          const promise = db.fieldItems.update(item, organisationId, client);
          promises.push(promise);
        }
      }
      await Promise.all(promises);
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

const moveUp = async (req, res) => {
  const { fieldId } = req.body;
  await db.fields.moveUp(fieldId, req.user.organisationId);
  return res.sendStatus(200);
}

const getById = async (req, res) => {
  const { fieldId } = req.body;
  const field = await db.fields.getById(fieldId, req.user.organisationId);
  return res.json(field);
}

const getFilenameFields = async (req, res) => {
  const fields = await db.fields.getFilenameFields(req.user.organisationId);
  return res.json(fields);
}

const getCsvFields = async (req, res) => {
  const fields = await db.fields.getCsvFields(req.user.organisationId);
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

module.exports = {
  insert,
  update,
  moveUp,
  getById,
  getFilenameFields,
  getCsvFields,
  getAllFields,
  getSelectListItems,
  find,
  remove
};
