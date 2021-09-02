import getPool from '../database/db.js';
import bookingRepository from '../repositories/booking.js';

const db = {
  bookings: bookingRepository
};

const insert = async (req, res) => {
  const { userId, shifts } = req.body;
  const bookedById = req.user.id;
  const isAdmin = req.user.isAdmin;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const promises = [];
    for (const shift of shifts) {
      const { shiftId, shiftRoleId } = shift;
      const promise = await db.bookings.insert({ userId, shiftId, shiftRoleId }, bookedById, isAdmin, organisationId, client);
      promises.push(promise);
    }
    const results = await Promise.all(promises);
    await client.query('commit');
    const rowCount = results.filter(r => r.rowCount === 1).length;
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

const remove = async (req, res) => {
  const { userId, bookingId } = req.body;
  const result = await db.bookings.remove({ userId, bookingId }, req.user.isAdmin, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

export {
  insert,
  remove
};
