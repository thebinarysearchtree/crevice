import pool from '../database/db.js';
import sql from '../../sql';

const { followers } = sql;

const insert = async ({
  userId, 
  followingId
}, organisationId, client = pool) => {
  const text = followers.insert;
  const values = [userId, followingId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

const find = async ({
  userId,
  startTime,
  endTime
}, organisationId, client = pool) => {
  const text = followers.find;
  const values = [userId, startTime, endTime, organisationId];
  const result = await client.query(text, values);
  return result.rows[0].result;
}

const remove = async ({
  userId, 
  followingId
}, organisationId, client = pool) => {
  const text = followers.remove;
  const values = [userId, followingId, organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert,
  find,
  remove
};
