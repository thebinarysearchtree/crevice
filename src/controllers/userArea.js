import { Client } from '../database/db.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';

const insertMany = async (req, res) => {
  const userAreas = req.body;
  const db = new Client();
  await db.connect();
  try {
    await db.begin();
    const promises = userAreas.map(userArea => db.rowCount(sql.userAreas.insert, {
      ...userArea,
      organisationId: req.user.organisationId
    }));
    const rowCounts = await Promise.all(promises);
    await db.commit();
    return res.json({ rowCount: rowCounts.reduce((a, c) => a + c) });
  }
  catch (e) {
    await db.rollback();
    return res.sendStatus(500);
  }
  finally {
    db.release();
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
