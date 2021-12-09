import pool from '../database/db.js';
import sql from '../../sql.js';

const { bookings } = sql;

const insert = async ({
  userId,
  shiftId,
  shiftRoleId
}, bookedById, isAdmin, organisationId, client = pool) => {
  const text = bookings.insert;
  const values = [
    shiftId, 
    shiftRoleId, 
    userId, 
    bookedById, 
    isAdmin, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const transfer = async (shiftId, seriesId, organisationId, client = pool) => {
  const text = bookings.transfer;
  const values = [shiftId, seriesId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const remove = async ({
  userId,
  bookingId
}, isAdmin, organisationId, client = pool) => {
  const text = bookings.remove;
  const values = [userId, bookingId, isAdmin, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  transfer,
  remove
};
