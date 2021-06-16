const getPool = require('../database/db');
const shiftRepository = require('../repositories/shift');
const shiftRoleRepository = require('../repositories/shiftRole');

const db = {
  shifts: shiftRepository,
  shiftRoles: shiftRoleRepository
};

const insert = async (req, res) => {
  const { shift, shiftRoles } = req.body;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const shiftId = await db.shifts.insert(shift, req.user.id, organisationId, client);
    const promises = [];
    for (const shiftRole of shiftRoles) {
      const promise = db.shiftRoles.insert({...shiftRole, shiftId }, organisationId, client);
      promises.push(promise);
    }
    await Promise.all(promises);
    await client.query('commit');
    return res.json({ shiftId });
  }
  catch (e) {
    await client.query('rollback');
    return res.sendStatus(500);
  }
  finally {
    client.release();
  }
}

const find = async (req, res) => {
  const query = req.body;
  const shifts = await db.shifts.find(query, req.user.organisationId);
  return res.json(shifts);
}

module.exports = {
  insert,
  find
};
