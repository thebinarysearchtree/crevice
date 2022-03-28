import { pool, db } from '../database/db.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';

const insertMany = async (req, res) => {
  const userAreas = req.body;
  const client = await pool.connect();
  try {
    await client.query('begin');
    const promises = userAreas.map(userArea => db.rowCount(sql.userAreas.insert, {
      ...userArea,
      organisationId: req.user.organisationId
    }, client));
    const rowCounts = await Promise.all(promises);
    await client.query('commit');
    return res.json({ rowCount: rowCounts.reduce((a, c) => a + c) });
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

const userAreas = sql.userAreas;

const routes = [
  {
    sql: userAreas.insert,
    params,
    route: '/userAreas/insert',
    middleware
  },
  {
    handler: insertMany,
    route: '/userAreas/insertMany',
    middleware
  },
  {
    sql: userAreas.update,
    params,
    route: '/userAreas/update',
    middleware
  },
  {
    sql: userAreas.find,
    params,
    route: '/userAreas/find',
    middleware,
    wrap: true
  },
  {
    sql: userAreas.remove,
    params,
    route: '/userAreas/remove',
    middleware
  }
];

add(routes);
