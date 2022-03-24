import pool from '../database/db.js';
import db from '../utils/db.js';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';

const getParams = (field, organisationId) => [...Object.values(field), organisationId];

const insertSelect = async (params, organisationId, selectItems, client) => {
  const fieldId = await db.value(sql.fields.insert, params, client);
  if (fieldId === null) {
    return 0;
  }
  const promises = [];
  for (const item of selectItems) {
    const { name, itemNumber } = item;
    const params = [fieldId, name, itemNumber, organisationId];
    const promise = db.rowCount(sql.fieldItems.insert, params, client);
    promises.push(promise);
  }
  await Promise.all(promises);
  return 1;
}

const insert = async (req, res) => {
  const { selectItems, ...field } = req.body;
  const organisationId = req.user.organisationId;
  const params = getParams(field, organisationId);
  const client = await pool.connect();
  try {
    await client.query('begin');
    let rowCount;
    if (selectItems) {
      rowCount = await insertSelect(params, organisationId, selectItems, client);
    }
    else {
      rowCount = await db.rowCount(sql.fields.insert, params, client);
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
    const sql = sql.fields.getById;
    const params = [fieldId, organisationId];
    const field = await db.first(sql, params, client);
    if (name !== existingName) {
      const sql = sql.fields.update;
      const params = [fieldId, name, organisationId];
      const rowCount = await db.rowCount(sql, params, client);
      totalRowCount += rowCount;
    }
    if (field.fieldType === 'Select') {
      const existingItemIds = field.selectItems.map(i => i.id);
      const promises = [];
      for (const item of itemsToDelete) {
        const { id } = item;
        if (existingItemIds.includes(id)) {
          const sql = sql.fieldItems.remove;
          const params = [id, organisationId];
          const promise = db.rowCount(sql, params, client);
          promises.push(promise);
        }
      }
      for (const item of itemsToAdd) {
        const { id, name } = item;
        const sql = sql.fieldItems.insert;
        const params = [id, name, fieldId, organisationId];
        const promise = db.rowCount(sql, params, client);
        promises.push(promise);
      }
      for (const item of itemsToUpdate) {
        const { id, name } = item;
        if (existingItemIds.includes(id)) {
          const sql = sql.fieldItems.update;
          const params = [id, name, organisationId];
          const promise = db.rowCount(sql, params, client);
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

const middleware = [auth, admin];

const wrap = true;
const fields = sql.fields;

const routes = [
  {
    handler: insert,
    route: '/fields/insert',
    middleware
  },
  {
    handler: update,
    route: '/fields/update',
    middleware
  },
  {
    sql: fields.moveUp,
    params,
    route: '/fields/moveUp',
    middleware
  },
  {
    sql: fields.getById,
    params,
    route: '/fields/getById',
    middleware,
    wrap
  },
  {
    sql: fields.getByType,
    params: (req) => [['Short', 'Standard', 'Number'], req.user.organisationId],
    route: '/fields/getFilenameFields',
    middleware,
    wrap
  },
  {
    sql: fields.getByType,
    params: (req) => [['Short', 'Standard', 'Number', 'Select'], req.user.organisationId],
    route: '/fields/getCsvFields',
    middleware,
    wrap
  },
  {
    sql: fields.getAllFields,
    params,
    route: '/fields/getAllFields',
    middleware,
    wrap
  },
  {
    sql: fields.getItems,
    params,
    route: '/fields/getSelectListItems',
    middleware,
    wrap
  },
  {
    sql: fields.find,
    params,
    route: '/fields/find',
    middleware,
    wrap
  },
  {
    sql: fields.remove,
    params,
    route: '/fields/remove',
    middleware
  }
];

add(routes);
