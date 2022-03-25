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
    const promises = [];
    for (const shift of shifts) {
      const { shiftId, shiftRoleId } = shift;
      const promise = db.rowCount(sql.bookings.insert, [
        shiftId, 
        shiftRoleId, 
        userId, 
        bookedById, 
        isAdmin, 
        organisationId
      ], client);
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
