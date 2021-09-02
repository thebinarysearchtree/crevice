import getPool from '../database/db.js';
import shiftSeriesRepository from '../repositories/shiftSeries.js';
import shiftRepository from '../repositories/shift.js';
import shiftRoleRepository from '../repositories/shiftRole.js';

const db = {
  shiftSeries: shiftSeriesRepository,
  shifts: shiftRepository,
  shiftRoles: shiftRoleRepository
};

const insert = async (req, res) => {
  const { series, shift, shiftRoles } = req.body;
  const userId = req.user.id;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const { intervalWeeks, endDate, notes, questionGroupId } = series;
    const { areaId, times, breakMinutes } = shift;
    const seriesId = await db.shiftSeries.insert({
      intervalWeeks,
      endDate,
      notes,
      questionGroupId
    }, userId, organisationId, client);
    let promises = [];
    for (const range of times) {
      const { startTime, endTime } = range;
      const shift = {
        areaId, 
        startTime, 
        endTime, 
        breakMinutes, 
        seriesId
      };
      const promise = db.shifts.insert(shift, organisationId, client);
      promises.push(promise);
    }
    await Promise.all(promises);
    promises = [];
    for (const shiftRole of shiftRoles) {
      const promise = db.shiftRoles.insert({...shiftRole, seriesId }, organisationId, client);
      promises.push(promise);
    }
    await Promise.all(promises);
    await client.query('commit');
    return res.json({ rowCount: 1 });
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

const remove = async (req, res) => {
  const { shiftId } = req.body;
  const result = await db.shifts.remove(shiftId, req.user.organisationId);
  return res.json({ deletedCount: result.rowCount });
}

export {
  insert,
  find,
  getAvailableShifts,
  remove
};
