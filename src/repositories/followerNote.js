import getPool from '../database/db.js';
import { sql } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  bookingId,
  notes
}, createdBy, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into follower_notes(
      booking_id,
      notes,
      created_by,
      organisation_id)
    select ${bookingId}, ${notes}, ${createdBy}, ${organisationId}
    where
      exists(
        select 1
        from
          followers f join
          bookings b on f.following_user_id = b.user_id
        where
          f.user_id = ${createdBy} and
          b.id = ${bookingId} and
          f.organisation_id = ${organisationId})`);
  return result;
}

const remove = async (noteId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from follower_notes
    where
      id = ${noteId} and
      organisation_id = ${organisationId}`);
  return result;
}

export default {
  insert,
  remove
};
