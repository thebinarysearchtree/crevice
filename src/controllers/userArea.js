import getPool from '../database/db.js';
import userAreaRepository from '../repositories/userArea.js';

const db = {
  userAreas: userAreaRepository
};

const insert = async (req, res) => {
  const userArea = req.body;
  const result = await db.userAreas.insert(userArea, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const insertMany = async (req, res) => {
  const userAreas = req.body;
  const promises = [];
  const client = await getPool().connect();
  try {
    await client.query('begin');
    for (const userArea of userAreas) {
      const promise = db.userAreas.insert(userArea, req.user.organisationId, client);
      promises.push(promise);
    }
    const results = await Promise.all(promises);
    await client.query('commit');
    const rowCount = results.map(r => r.rowCount).filter(r => r !== 0).length;
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
  const result = await db.userAreas.update(userArea, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const find = async (req, res) => {
  const { userId } = req.body;
  const userAreas = await db.userAreas.find(userId, req.user.organisationId);
  return res.send(userAreas);
}

const remove = async (req, res) => {
  const { userAreaId } = req.body;
  const result = await db.userAreas.remove(userAreaId, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

export {
  insert,
  insertMany,
  update,
  find,
  remove
};
