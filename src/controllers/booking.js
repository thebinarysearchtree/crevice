import { pool, db } from '../database/db.js';
import sql from '../../sql.js';
import { add } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';

const insert = async (req, res) => {
  const { userId, shifts } = req.body;
  const bookedById = req.user.id;
  const isAdmin = req.user.isAdmin;
  const organisationId = req.user.organisationId;
  const client = await pool.connect();
  try {
    await client.query('begin');
    const promises = shifts.map(s => db.rowCount(sql.bookings.insert, [
      s.shiftId, 
      s.shiftRoleId, 
      userId, 
      bookedById, 
      isAdmin, 
      organisationId
    ], client));
    const results = await Promise.all(promises);
    await client.query('commit');
    return res.json({ rowCount: results.reduce((a, c) => a + c) });
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
    params: (req) => ({...req.body, isAdmin: req.user.isAdmin, organisationId: req.user.organisationId }),
    route: '/bookings/remove',
    middleware
  }
]);
