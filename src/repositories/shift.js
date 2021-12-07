import pool from '../database/db.js';
import { makeReviver } from '../utils/data.js';
import sql from '../../sql';

const { shifts } = sql;

const reviver = makeReviver();

const insert = async ({
  areaId,
  startTime,
  endTime,
  breakMinutes,
  seriesId
}, organisationId, client = pool) => {
  const text = shifts.insert;
  const values = [
    areaId, 
    startTime, 
    endTime, 
    breakMinutes, 
    seriesId, 
    organisationId];
  const result = await client.query(text, values);
  return result.rows[0].id;
}

const updateSeriesId = async (shiftId, seriesId, organisationId, client = pool) => {
  const text = shifts.updateSeriesId;
  const values = [shiftId, seriesId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const update = async ({
  seriesId,
  initialStartTime,
  initialEndTime,
  updatedStartTime,
  updatedEndTime,
  breakMinutes
}, organisationId, client = pool) => {
  const text = shifts.update;
  const values = [
    seriesId,
    initialStartTime,
    initialEndTime,
    updatedStartTime,
    updatedEndTime,
    breakMinutes,
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const find = async ({
  areaId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  if (!areaId) {
    const text = shifts.getFirstArea;
    const values = [organisationId];
    const result = await client.query(text, values);
    const { id, timeZone } = JSON.parse(result.rows[0].result, reviver)[0];
    areaId = id;
    startTime += timeZone;
    endTime += timeZone;
  }
  const text = shifts.find;
  const values = [areaId, startTime, endTime, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const getAvailableShifts = async ({
  userId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const text = shifts.getAvailableShifts;
  const values = [userId, startTime, endTime, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const remove = async (shiftId, organisationId, client = pool) => {
  const text = shifts.remove;
  const values = [shiftId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  updateSeriesId,
  update,
  find,
  getAvailableShifts,
  remove
};
