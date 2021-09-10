import getPool from '../database/db.js';
import { sql } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  isSingle,
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
      is_single,
      notes,
      created_by,
      question_group_id,
      organisation_id)
    select ${[isSingle, notes, userId, questionGroupId, organisationId]}
    ${where}
    returning id`);
  return result.rows[0].id;
}

const copy = async (seriesId, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into shift_series(
      is_single,
      notes,
      created_by,
      question_group_id,
      organisation_id)
    select 
      true as is_single, 
      notes, 
      created_by,
      question_group_id,
      organisation_id
    from shift_series
    where
      id = ${seriesId} and
      organisation_id = ${organisationId}
    returning id`);
  return result.rows[0].id;
}

const update = async ({
  id,
  notes,
  questionGroupId
}, organisationId, client = pool) => {
  const exists = questionGroupId ? sql`
    and exists(
      select 1 from question_groups
      where
        id = ${questionGroupId} and
        organisation_id = ${organisationId})` : sql``;
  const result = await client.query(sql`
    update shift_series
    set 
      notes = ${notes},
      question_group_id = ${questionGroupId}
    where
      id = ${id} and
      organisation_id = ${organisationId}
      ${exists}`);
  return result;
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
  copy,
  update,
  remove
};
