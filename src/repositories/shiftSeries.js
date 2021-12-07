import pool from '../database/db.js';
import sql from '../../sql';

const { shiftSeries } = sql;

const insert = async ({
  isSingle,
  notes,
  questionGroupId
}, userId, organisationId, client = pool) => {
  const text = shiftSeries.insert;
  const values = [
    isSingle, 
    notes, 
    userId, 
    questionGroupId, 
    organisationId];
  const result = await client.query(text, values);
  return result.rows[0].id;
}

const copy = async (seriesId, organisationId, client = pool) => {
  const text = shiftSeries.copy;
  const values = [seriesId, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].id;
}

const update = async ({
  id,
  notes,
  questionGroupId
}, organisationId, client = pool) => {
  const text = shiftSeries.update;
  const values = [id, notes, questionGroupId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const remove = async (seriesId, organisationId, client = pool) => {
  const text = shiftSeries.remove;
  const values = [seriesId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  copy,
  update,
  remove
};
