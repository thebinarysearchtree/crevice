import pool from '../database/db.js';
import fieldRepository from '../repositories/field.js';
import fieldItemRepository from '../repositories/fieldItem.js';

const db = {
  fields: fieldRepository,
  fieldItems: fieldItemRepository
};

const insertSelect = async (field, organisationId, client) => {
  const { fieldId, rowCount } = await db.fields.insert(field, organisationId, client);
  const promises = [];
  for (const item of field.selectItems) {
    const { name, itemNumber } = item;
    const promise = db.fieldItems.insert({ fieldId, name, itemNumber }, organisationId, client);
    promises.push(promise);
  }
  await Promise.all(promises);
  return rowCount;
}

const insert = async (req, res) => {
  const field = req.body;
  const { fieldType } = field;
  const organisationId = req.user.organisationId;
  const client = await pool.connect();
  try {
    await client.query('begin');
    let rowCount;
    if (fieldType === 'Select') {
      rowCount = await insertSelect(field, organisationId, client);
    }
    else {
      rowCount = await db.fields.insert(field, organisationId, client);
    }
    await client.query('commit');
    return res.json({ rowCount });
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
  const client = await pool.connect();
  try {
    await client.query('begin');
    let totalRowCount = 0;
    const field = await db.fields.getById(fieldId, organisationId, client);
    if (name !== existingName) {
      const rowCount = await db.fields.update(fieldId, name, organisationId, client);
      totalRowCount += rowCount;
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
      const rowCounts = await Promise.all(promises);
      for (const rowCount of rowCounts) {
        totalRowCount += rowCount;
      }
    }
    await client.query('commit');
    return res.json({ rowCount: totalRowCount });
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
  const rowCount = await db.fields.moveUp(fieldId, req.user.organisationId);
  return res.json({ rowCount });
}

const getById = async (req, res) => {
  const { fieldId } = req.body;
  const field = await db.fields.getById(fieldId, req.user.organisationId);
  return res.send(field);
}

const getFilenameFields = async (req, res) => {
  const fields = await db.fields.getFilenameFields(req.user.organisationId);
  return res.send(fields);
}

const getCsvFields = async (req, res) => {
  const fields = await db.fields.getCsvFields(req.user.organisationId);
  return res.send(fields);
}

const getAllFields = async (req, res) => {
  const fields = await db.fields.getAllFields(req.user.organisationId);
  return res.send(fields);
}

const getSelectListItems = async (req, res) => {
  const selectListItems = await db.fields.getSelectListItems(req.user.organisationId);
  return res.send(selectListItems);
}

const find = async (req, res) => {
  const fields = await db.fields.find(req.user.organisationId);
  return res.send(fields);
}

const remove = async (req, res) => {
  const { fieldId } = req.body;
  await db.fields.remove(fieldId, req.user.organisationId);
  return res.json({ rowCount: 1 });
}

export {
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
