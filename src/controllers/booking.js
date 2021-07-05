const getPool = require('../database/db');
const bookingRepository = require('../repositories/booking');

const db = {
  bookings: bookingRepository
};

const insert = async (req, res) => {
  const { userId, shiftRoleIds } = req.body;
  const bookedById = req.user.id;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const promises = [];
    for (const shiftRoleId of shiftRoleIds) {
      const promise = await db.bookings.insert({ userId, shiftRoleId }, bookedById, organisationId, client);
      promises.push(promise);
    }
    const results = await Promise.all(promises);
    await client.query('commit');
    const bookedCount = results.filter(r => r.rowCount === 1).length;
  }
  catch (e) {
    await client.query('rollback');
    return res.sendStatus(500);
  }
  finally {
    client.release();
  }
}