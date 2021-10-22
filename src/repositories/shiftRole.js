import getPool from '../database/db.js';
import { sql } from '../utils/data.js';

const pool = getPool();

const insert = async ({
  seriesId,
  roleId,
  capacity
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into shift_roles(
      series_id,
      role_id,
      capacity,
      organisation_id)
    select ${[
      seriesId,
      roleId,
      capacity,
      organisationId]}
    where
      exists(
        select 1 from shift_series
        where
          id = ${seriesId} and
          organisation_id = ${organisationId}) and
      exists(
        select 1 from roles
        where
          id = ${roleId} and
          organisation_id = ${organisationId}) and
      not exists(
        select 1 from shift_roles
        where
          series_id = ${seriesId} and
          role_id = ${roleId})
    returning id`);
  return result.rows[0].id;
}

const copy = async (fromSeriesId, toSeriesId, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into shift_roles(
      series_id,
      role_id,
      capacity,
      organisation_id)
    select
      ${toSeriesId} as series_id,
      role_id,
      capacity,
      organisation_id
    from shift_roles
    where
      series_id = ${fromSeriesId} and
      organisation_id = ${organisationId}`);
  return result;
}

const update = async ({
  id,
  seriesId,
  roleId,
  capacity
}, organisationId, client = pool) => {
  const where = id ? sql`id = ${id}` : sql`series_id = ${seriesId} and role_id = ${roleId}`;
  const result = await client.query(sql`
    update shift_roles
    set capacity = ${capacity}
    where
      ${where} and
      organisation_id = ${organisationId}`);
  return result;
}

const remove = async ({
  id,
  seriesId,
  roleId
}, organisationId, client = pool) => {
  const where = id ? sql`id = ${id}` : sql`series_id = ${seriesId} and role_id = ${roleId}`;
  const result = await client.query(sql`
    delete from shift_roles
    where
      ${where} and
      organisation_id = ${organisationId}`);
  return result;
}

export default {
  insert,
  copy,
  update,
  remove
};
