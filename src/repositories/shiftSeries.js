import getPool from '../database/db.js';
import { sql } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  intervalWeeks,
  endDate,
  notes,
  questionGroupId
}, userId, organisationId, client = pool) => {
  const where = questionGroupId ? sql`
    where exists(
      select 1 from question_groups
      where
        id = ${questionGroupId} and
        organisation_id = ${organisationId})` : sql``;
  const result = await client.query(sql`
    insert into shift_series(
      interval_weeks,
      end_date,
      notes,
      created_by,
      question_group_id,
      organisation_id)
    select ${[intervalWeeks, endDate, notes, userId, questionGroupId, organisationId]}
    ${where}
    returning id`);
  return result.rows[0].id;
}

const remove = async (seriesId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from shift_series
    where
      id = ${seriesId} and
      organisation_id = ${organisationId}`);
  return result;
}

export default {
  insert,
  remove
};
