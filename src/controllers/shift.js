const getPool = require('../database/db');
const shiftRepository = require('../repositories/shift');
const shiftRoleRepository = require('../repositories/shiftRole');
const { v4: uuid } = require('uuid');

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
    const { areaId, times, breakMinutes, notes } = shift;
    const seriesId = times.length === 1 ? null : uuid();
    let promises = [];
    for (const range of times) {
      const { startTime, endTime } = range;
      const shift = {
        areaId, 
        startTime, 
        endTime, 
        breakMinutes, 
        notes,
        seriesId
      };
      const promise = db.shifts.insert(shift, req.user.id, organisationId, client);
      promises.push(promise);
    }
    const shiftIds = await Promise.all(promises);
    const shiftId = shiftIds[0];
    promises = [];
    for (const shiftRole of shiftRoles) {
      const promise = db.shiftRoles.insert({...shiftRole, seriesId, shiftId }, organisationId, client);
      promises.push(promise);
    }
    await Promise.all(promises);
    await client.query('commit');
    return res.sendStatus(200);
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
  return res.send(shifts);
}

const getAvailableShifts = async (req, res) => {
  const query = req.body;
  const shifts = await db.shifts.getAvailableShifts(query, req.user.organisationId);
  return res.send(shifts);
}

module.exports = {
  insert,
  find,
  getAvailableShifts
};
