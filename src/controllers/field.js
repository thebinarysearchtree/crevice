import { pool, db } from '../database/db.js';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';

const insertSelect = async (params, organisationId, selectItems, client) => {
  const fieldId = await db.value(sql.fields.insert, params, client);
  if (fieldId === null) {
    return 0;
  }
  const promises = [];
  for (const item of selectItems) {
    const { name, itemNumber } = item;
    const promise = db.rowCount(sql.fieldItems.insert, {
      fieldId, 
      name, 
      itemNumber, 
      organisationId
    }, client);
    promises.push(promise);
  }
  await Promise.all(promises);
  return 1;
}

const insert = async (req, res) => {
  const { selectItems, ...field } = req.body;
  const organisationId = req.user.organisationId;
  const params = { ...field, organisationId };
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
    const query = sql.fields.getById;
    const params = { fieldId, organisationId };
    const field = await db.first(query, params, client);
    if (name !== existingName) {
      const rowCount = await db.rowCount(sql.fields.update, {
        fieldId, 
        name, 
        organisationId
      }, client);
      totalRowCount += rowCount;
    }
    if (field.fieldType === 'Select') {
      const existingItemIds = field.selectItems.map(i => i.id);
      const promises = [];
      for (const item of itemsToDelete) {
        const { id } = item;
        if (existingItemIds.includes(id)) {
          const promise = db.rowCount(sql.fieldItems.remove, {
            id, 
            organisationId
          }, client);
          promises.push(promise);
        }
      }
      for (const item of itemsToAdd) {
        const { id, name } = item;
        const promise = db.rowCount(sql.fieldItems.insert, {
          id, 
          name, 
          fieldId, 
          organisationId
        }, client);
        promises.push(promise);
      }
      for (const item of itemsToUpdate) {
        const { id, name } = item;
        if (existingItemIds.includes(id)) {
          const promise = db.rowCount(sql.fieldItems.update, {
            id, 
            name, 
            organisationId
          }, client);
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
    params: (req) => ({ types: ['Short', 'Standard', 'Number'], organisationId: req.user.organisationId }),
    route: '/fields/getFilenameFields',
    middleware,
    wrap
  },
  {
    sql: fields.getByType,
    params: (req) => ({ types: ['Short', 'Standard', 'Number', 'Select'], organisationId: req.user.organisationId }),
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
