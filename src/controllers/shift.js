import pool from '../database/db.js';
import db from '../utils/db.js';
import sql from '../../sql.js';
import { add } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { admin, owner } from '../middleware/permission.js';

const insert = async (req, res) => {
  const { series, shift, shiftRoles } = req.body;
  const userId = req.user.id;
  const organisationId = req.user.organisationId;
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { notes, questionGroupId } = series;
    const { areaId, times, breakMinutes } = shift;
    const sql = sql.shiftSeries.insert;
    const params = [times.length === 1, notes, questionGroupId, userId, organisationId];
    const seriesId = await db.value(sql, params, client);
    let promises = [];
    for (const range of times) {
      const { startTime, endTime } = range;
      const sql = sql.shifts.insert;
      const params = [areaId, startTime, endTime, breakMinutes, seriesId, organisationId];
      const promise = db.empty(sql, params, client);
      promises.push(promise);
    }
    await Promise.all(promises);
    promises = [];
    for (const shiftRole of shiftRoles) {
      const sql = sql.shiftRoles.insert;
      const params = [...Object.values(shiftRole), seriesId, organisationId];
      const promise = db.empty(sql, params, client);
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
  const client = await pool.connect();
  try {
    await client.query('begin');
    const promises = [];
    let seriesId = initialSeries.id;
    if (detach) {
      seriesId = await db.value(sql.shiftSeries.copy, [updatedSeries.id, organisationId], client);
      await db.empty(sql.shiftRoles.copy, [initialSeries.id, seriesId, organisationId], client);
      await db.empty(sql.shifts.updateSeriesId, [initialShift.id, seriesId, organisationId], client);
      await db.empty(sql.bookings.transfer, [initialShift.id, seriesId, organisationId], client);
      remove = remove.map(sr => ({...sr, id: null, seriesId }));
      update = update.map(sr => ({...sr, id: null, seriesId }));
    }
    if (initialSeries.notes !== updatedSeries.notes) {
      const promise = db.empty(sql.shiftSeries.update, [...Object.values(updatedSeries), organisationId], client);
      promises.push(promise);
    }
    if (
      initialShift.startTime !== updatedShift.startTime || 
      initialShift.endTime !== updatedShift.endTime || 
      initialShift.breakMinutes !== updatedShift.breakMinutes) {
        const promise = db.empty(sql.shifts.update, [
          seriesId,
          initialShift.startTime,
          initialShift.endTime,
          updatedShift.startTime,
          updatedShift.endTime,
          updatedShift.breakMinutes,
          organisationId], client);
        promises.push(promise);
    }
    for (const shiftRole of remove) {
      const promise = db.empty(sql.shiftRoles.remove, [...Object.values(shiftRole), organisationId], client);
      promises.push(promise);
    }
    for (const shiftRole of add) {
      const promise = db.empty(sql.shiftRoles.insert, [...Object.values(shiftRole), initialSeries.id, organisationId], client);
      promises.push(promise);
    }
    for (const shiftRole of update) {
      const promise = db.empty(sql.shiftRoles.update, [...Object.values(shiftRole), organisationId], client);
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

const routes = [
  {
    handler: insert,
    route: '/shifts/insert',
    middleware: [auth, admin]
  },
  {
    handler: update,
    route: '/shifts/update',
    middleware: [auth, admin]
  },
  {
    sql: sql.shifts.find,
    params,
    route: '/shifts/find',
    middleware: [auth, admin],
    wrap: true
  },
  {
    sql: sql.shifts.getAvailableShifts,
    params,
    route: '/shifts/getAvailableShifts',
    middleware: [auth, owner],
    wrap: true
  },
  {
    sql: sql.shifts.remove,
    params,
    route: '/shifts/remove',
    middleware: [auth, admin]
  }
];

add(routes);
