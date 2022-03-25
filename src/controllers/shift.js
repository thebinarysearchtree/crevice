import { pool, db } from '../database/db.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';
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
    const seriesId = await db.value(sql.shiftSeries.insert, [
      times.length === 1, 
      notes, 
      questionGroupId, 
      userId, 
      organisationId
    ], client);
    await Promise.all(times.map(t => db.empty(sql.shifts.insert, [
      areaId, 
      t.startTime, 
      t.endTime, 
      breakMinutes, 
      seriesId, 
      organisationId
    ], client)));
    await Promise.all(shiftRoles.map(sr => db.empty(sql.shiftRoles.insert, [
      ...Object.values(sr), 
      seriesId, 
      organisationId
    ], client)));
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
      seriesId = await db.value(sql.shiftSeries.copy, [
        updatedSeries.id, 
        organisationId
      ], client);
      await db.empty(sql.shiftRoles.copy, [
        initialSeries.id, 
        seriesId, 
        organisationId
      ], client);
      await db.empty(sql.shifts.updateSeriesId, [
        initialShift.id, 
        seriesId, 
        organisationId
      ], client);
      await db.empty(sql.bookings.transfer, [
        initialShift.id, 
        seriesId, 
        organisationId
      ], client);
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
          organisationId
        ], client);
        promises.push(promise);
    }
    for (const shiftRole of remove) {
      const { id, seriesId, roleId } = shiftRole;
      const query = id ? sql.shiftRoles.remove : sql.shiftRoles.removeBySeriesId;
      const params = id ? [id, organisationId] : [seriesId, roleId, organisationId];
      const promise = db.empty(query, params, client);
      promises.push(promise);
    }
    for (const shiftRole of add) {
      const promise = db.empty(sql.shiftRoles.insert, [
        ...Object.values(shiftRole), 
        initialSeries.id, 
        organisationId
      ], client);
      promises.push(promise);
    }
    for (const shiftRole of update) {
      const { id, seriesId, roleId, capacity } = shiftRole;
      const query = id ? sql.shiftRoles.update : sql.shiftRoles.updateBySeriesId;
      const params = id ? [id, capacity, organisationId] : [seriesId, roleId, capacity, organisationId];
      const promise = db.empty(query, params, client);
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
  const organisationId = req.user.organisationId;
  let { areaId, startTime, endTime } = req.body;
  if (!areaId) {
    const { id, timeZone } = await db.first(sql.shifts.getFirstArea, [organisationId]);
    areaId = id;
    startTime += timeZone;
    endTime += timeZone;
  }
  const shifts = await db.text(sql.shifts.find, [
    areaId, 
    startTime, 
    endTime, 
    organisationId
  ]);
  return res.send(shifts);
}

const middleware = [auth, admin];

const wrap = true;
const shifts = sql.shifts;

const routes = [
  {
    handler: insert,
    route: '/shifts/insert',
    middleware
  },
  {
    handler: update,
    route: '/shifts/update',
    middleware
  },
  {
    handler: find,
    route: '/shifts/find',
    middleware
  },
  {
    sql: shifts.getAvailableShifts,
    params,
    route: '/shifts/getAvailableShifts',
    middleware: [auth, owner],
    wrap
  },
  {
    sql: shifts.remove,
    params,
    route: '/shifts/remove',
    middleware
  }
];

add(routes);
