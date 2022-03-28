import { pool, db, Client } from '../database/db.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { admin, owner } from '../middleware/permission.js';

const insert = async (req, res) => {
  const { series, shift, shiftRoles } = req.body;
  const userId = req.user.id;
  const organisationId = req.user.organisationId;
  const db = new Client();
  await db.connect();
  try {
    await db.begin();
    const { notes, questionGroupId } = series;
    const { areaId, times, breakMinutes } = shift;
    const seriesId = await db.value(sql.shiftSeries.insert, {
      isSingle: times.length === 1, 
      notes, 
      questionGroupId, 
      userId, 
      organisationId
    });
    await Promise.all(times.map(t => db.empty(sql.shifts.insert, {
      areaId, 
      startTime: t.startTime, 
      endTime: t.endTime, 
      breakMinutes, 
      seriesId, 
      organisationId
    })));
    await Promise.all(shiftRoles.map(shiftRole => db.empty(sql.shiftRoles.insert, {
      ...shiftRole, 
      seriesId, 
      organisationId
    })));
    await db.commit();
    return res.json({ rowCount: 1 });
  }
  catch (e) {
    await db.rollback();
    return res.sendStatus(500);
  }
  finally {
    db.release();
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
  const db = new Client();
  await db.connect();
  try {
    await db.begin();
    const promises = [];
    let seriesId = initialSeries.id;
    if (detach) {
      seriesId = await db.value(sql.shiftSeries.copy, {
        seriesId: updatedSeries.id, 
        organisationId
      });
      await db.empty(sql.shiftRoles.copy, {
        fromSeriesId: initialSeries.id, 
        toSeriesId: seriesId, 
        organisationId
      });
      await db.empty(sql.shifts.updateSeriesId, {
        shiftId: initialShift.id, 
        seriesId, 
        organisationId
      });
      await db.empty(sql.bookings.transfer, {
        fromSeriesId: initialShift.id, 
        toSeriesId: seriesId, 
        organisationId
      });
      remove = remove.map(sr => ({...sr, id: null, seriesId }));
      update = update.map(sr => ({...sr, id: null, seriesId }));
    }
    if (initialSeries.notes !== updatedSeries.notes) {
      const promise = db.empty(sql.shiftSeries.update, {...updatedSeries, organisationId });
      promises.push(promise);
    }
    if (
      initialShift.startTime !== updatedShift.startTime || 
      initialShift.endTime !== updatedShift.endTime || 
      initialShift.breakMinutes !== updatedShift.breakMinutes) {
        const promise = db.empty(sql.shifts.update, {
          seriesId,
          initialStartTime: initialShift.startTime,
          initialEndTime: initialShift.endTime,
          updatedStartTime: updatedShift.startTime,
          updatedEndTime: updatedShift.endTime,
          breakMinutes: updatedShift.breakMinutes,
          organisationId
        });
        promises.push(promise);
    }
    for (const shiftRole of remove) {
      const { id, seriesId, roleId } = shiftRole;
      const query = id ? sql.shiftRoles.remove : sql.shiftRoles.removeBySeriesId;
      const params = id ? { id, organisationId } : { seriesId, roleId, organisationId };
      const promise = db.empty(query, params);
      promises.push(promise);
    }
    for (const shiftRole of add) {
      const promise = db.empty(sql.shiftRoles.insert, {
        ...shiftRole, 
        seriesId: initialSeries.id, 
        organisationId
      });
      promises.push(promise);
    }
    for (const shiftRole of update) {
      const { id, seriesId, roleId, capacity } = shiftRole;
      const query = id ? sql.shiftRoles.update : sql.shiftRoles.updateBySeriesId;
      const params = id ? { id, capacity, organisationId } : { seriesId, roleId, capacity, organisationId };
      const promise = db.empty(query, params);
      promises.push(promise);
    }
    await Promise.all(promises);
    await db.commit();
    return res.json({ rowCount: 1 });
  }
  catch (e) {
    await db.rollback();
    return res.sendStatus(500);
  }
  finally {
    db.release();
  }
}

const find = async (req, res) => {
  const organisationId = req.user.organisationId;
  let { areaId, startTime, endTime } = req.body;
  if (!areaId) {
    const { id, timeZone } = await db.first(sql.shifts.getFirstArea, { organisationId });
    areaId = id;
    startTime += timeZone;
    endTime += timeZone;
  }
  const shifts = await db.text(sql.shifts.find, {
    areaId, 
    startTime, 
    endTime, 
    organisationId
  });
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
