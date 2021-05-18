const getPool = require('../database/db');
const userAreaRepository = require('../repositories/userArea');

const db = {
  userAreas: userAreaRepository
};

const insert = async (req, res) => {
  const userArea = req.body;
  const userAreaId = await db.userAreas.insert(userArea, req.user.organisationId);
  return res.json({ userAreaId });
}

const insertMany = async (req, res) => {
  const { userAreas, userId } = req.body;
  const promises = [];
  const client = await getPool().connect();
  try {
    await client.query('begin');
    for (const userArea of userAreas) {
      const promise = db.userAreas.insert(userArea, req.user.organisationId, client);
      promises.push(promise);
    }
    await Promise.all(promises);
    const updatedAreas = await db.userAreas.find(userId, req.user.organisationId, client);
    await client.query('commit');
    return res.json(updatedAreas);
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
  await db.userAreas.update(userArea, req.user.organisationId);
  return res.sendStatus(200);
}

const find = async (req, res) => {
  const { userId } = req.body;
  const userAreas = await db.userAreas.find(userId, req.user.organisationId);
  return res.json(userAreas);
}

const remove = async (req, res) => {
  const { userAreaId } = req.body;
  await db.userAreas.remove(userAreaId, req.user.organisationId);
  return res.sendStatus(200);
}

module.exports = {
  insert,
  insertMany,
  update,
  find,
  remove
};
