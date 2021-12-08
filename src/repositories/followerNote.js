import pool from '../database/db.js';
import sql from '../../sql.js';

const { followerNotes } = sql;

const insert = async ({
  bookingId,
  notes
}, createdBy, organisationId, client = pool) => {
  const text = followerNotes.insert;
  const values = [bookingId, notes, createdBy, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const remove = async (noteId, organisationId, client = pool) => {
  const text = followerNotes.remove;
  const values = [noteId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  remove
};
