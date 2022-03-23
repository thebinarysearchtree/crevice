import pool from '../database/db.js';
import db from '../utils/db.js';
import sql from '../../sql.js';
import { add, rowCount, text, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';

const insertMany = async (req, res) => {
  const userAreas = req.body;
  const promises = [];
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const userArea of userAreas) {
      const promise = db.rowCount(sql.userAreas.insert, [...Object.values(userArea), req.user.organisationId], client);
      promises.push(promise);
    }
    const rowCounts = await Promise.all(promises);
    await client.query('commit');
    const rowCount = rowCounts.reduce((a, c) => a + c);
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

const middleware = [auth, admin];

const routes = [
  {
    sql: sql.userAreas.insert,
    params,
    response: rowCount,
    route: '/userAreas/insert',
    middleware
  },
  {
    handler: insertMany,
    route: '/userAreas/insertMany',
    middleware
  },
  {
    sql: sql.userAreas.update,
    params,
    response: rowCount,
    route: '/userAreas/update',
    middleware
  },
  {
    sql: sql.userAreas.find,
    params,
    response: text,
    route: '/userAreas/find',
    middleware
  },
  {
    sql: sql.userAreas.remove,
    params,
    response: rowCount,
    route: '/userAreas/remove',
    middleware
  }
];

add(routes);
