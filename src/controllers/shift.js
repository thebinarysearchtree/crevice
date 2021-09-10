import getPool from '../database/db.js';
import shiftSeriesRepository from '../repositories/shiftSeries.js';
import shiftRepository from '../repositories/shift.js';
import shiftRoleRepository from '../repositories/shiftRole.js';
import bookingRepository from '../repositories/booking.js';

const db = {
  shiftSeries: shiftSeriesRepository,
  shifts: shiftRepository,
  shiftRoles: shiftRoleRepository,
  bookings: bookingRepository
};

const insert = async (req, res) => {
  const { series, shift, shiftRoles } = req.body;
  const userId = req.user.id;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const { notes, questionGroupId } = series;
    const { areaId, times, breakMinutes } = shift;
    const seriesId = await db.shiftSeries.insert({
      isSingle: times.length === 1,
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

const update = async (req, res) => {
  let { 
    initialSeries, 
    updatedSeries, 
    initialShift, 
    updatedShift, 
    remove, 
    add, 
    update, 
    detach 
  } = req.body;
  const organisationId = req.user.organisationId;
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const promises = [];
    let seriesId = initialSeries.id;
    if (detach) {
      seriesId = await db.shiftSeries.copy(updatedSeries.id, organisationId, client);
      await db.shiftRoles.copy(initialSeries.id, seriesId, organisationId, client);
      await db.shifts.updateSeriesId(initialShift.id, seriesId, organisationId, client);
      await db.bookings.transfer(initialShift.id, seriesId, organisationId, client);
      remove = remove.map(sr => ({...sr, id: null, seriesId }));
      update = update.map(sr => ({...sr, id: null, seriesId }));
    }
    if (initialSeries.notes !== updatedSeries.notes) {
      const promise = db.shiftSeries.update(updatedSeries, organisationId, client);
      promises.push(promise);
    }
    if (
      initialShift.startTime !== updatedShift.startTime || 
      initialShift.endTime !== updatedShift.endTime || 
      initialShift.breakMinutes !== updatedShift.breakMinutes) {
        const promise = db.shifts.update({
          seriesId,
          initialStartTime: initialShift.startTime,
          initialEndTime: initialShift.endTime,
          updatedStartTime: updatedShift.startTime,
          updatedEndTime: updatedShift.endTime,
          breakMinutes: updatedShift.breakMinutes
        }, organisationId, client);
        promises.push(promise);
    }
    for (const shiftRole of remove) {
      const promise = db.shiftRoles.remove(shiftRole, organisationId, client);
      promises.push(promise);
    }
    for (const shiftRole of add) {
      const promise = db.shiftRoles.insert({...shiftRole, seriesId: initialSeries.id }, organisationId, client);
      promises.push(promise);
    }
    for (const shiftRole of update) {
      const promise = db.shiftRoles.update(shiftRole, organisationId, client);
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
  const { shiftId, seriesId, type } = req.body;
  const organisationId = req.user.organisationId;
  let result;
  if (type === 'shift') {
    result = await db.shifts.remove(shiftId, organisationId);
  }
  else {
    result = await db.shiftSeries.remove(seriesId, organisationId);
  }
  return res.json({ rowCount: result.rowCount });
}

export {
  insert,
  update,
  find,
  getAvailableShifts,
  remove
};
