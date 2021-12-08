import pool from '../database/db.js';
import userAreaRepository from '../repositories/userArea.js';

const db = {
  userAreas: userAreaRepository
};

const insert = async (req, res) => {
  const userArea = req.body;
  const rowCount = await db.userAreas.insert(userArea, req.user.organisationId);
  return res.json({ rowCount });
}

const insertMany = async (req, res) => {
  const userAreas = req.body;
  const promises = [];
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const userArea of userAreas) {
      const promise = db.userAreas.insert(userArea, req.user.organisationId, client);
      promises.push(promise);
    }
    const rowCounts = await Promise.all(promises);
    await client.query('commit');
    const rowCount = rowCounts.reduce((a, c) => a + c);
    return res.json({ rowCount });
  }
  catch (e) {
    await client.query('rollback');
    return res.sendStatus(500);
  }
  finally {
    client.release();
  }
}

const update = async (req, res) => {
  const userArea = req.body;
  const rowCount = await db.userAreas.update(userArea, req.user.organisationId);
  return res.json({ rowCount });
}

const find = async (req, res) => {
  const { userId } = req.body;
  const userAreas = await db.userAreas.find(userId, req.user.organisationId);
  return res.send(userAreas);
}

const remove = async (req, res) => {
  const { userAreaId } = req.body;
  const rowCount = await db.userAreas.remove(userAreaId, req.user.organisationId);
  return res.json({ rowCount });
}

export {
  insert,
  insertMany,
  update,
  find,
  remove
};
