import pool from '../database/db.js';
import db from '../utils/db.js';
import sql from '../../sql.js';
import { add } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';

const sql = sql.bookings.insert;

const insert = async (req, res) => {
  const { userId, shifts } = req.body;
  const bookedById = req.user.id;
  const isAdmin = req.user.isAdmin;
  const organisationId = req.user.organisationId;
  const client = await pool.connect();
  try {
    await client.query('begin');
    const promises = [];
    for (const shift of shifts) {
      const { shiftId, shiftRoleId } = shift;
      const params = [userId, shiftId, shiftRoleId, bookedById, isAdmin, organisationId];
      const promise = db.rowCount(sql, params, client);
      promises.push(promise);
    }
    const results = await Promise.all(promises);
    await client.query('commit');
    const rowCount = results.reduce((a, c) => a + c);
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

const middleware = [auth, owner];

add([
  {
    handler: insert,
    route: '/bookings/insert',
    middleware
  },
  {
    sql: sql.bookings.remove,
    params: (req) => [...Object.values(req.body), req.user.isAdmin, req.user.organisationId],
    route: '/bookings/remove',
    middleware
  }
]);
