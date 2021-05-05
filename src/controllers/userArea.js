const userAreaRepository = require('../repositories/userArea');

const db = {
  userAreas: userAreaRepository
};

const insert = async (req, res) => {
  const userArea = req.body;
  const userAreaId = await db.userAreas.insert(userArea, req.user.organisationId);
  return res.json({ userAreaId });
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
  update,
  find,
  remove
};
