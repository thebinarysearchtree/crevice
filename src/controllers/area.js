const areaRepository = require('../repositories/area');

const db = {
  areas: areaRepository
};

const insert = async (req, res) => {
  const area = req.body;
  const areaId = await db.areas.insert(area, req.user.organisationId);
  return res.json({ areaId });
}

const update = async (req, res) => {
  const area = req.body;
  await db.areas.update(area, req.user.organisationId);
  return res.sendStatus(200);
}

const getById = async (req, res) => {
  const { areaId } = req.body;
  const area = await db.areas.getById(areaId, req.user.organisationId);
  return res.json(area);
}

const getSelectListItems = async (req, res) => {
  const selectListItems = await db.areas.getSelectListItems(req.user.organisationId);
  return res.json(selectListItems);
}

const find = async (req, res) => {
  const areas = await db.areas.find(req.user.organisationId);
  return res.json(areas);
}

const remove = async (req, res) => {
  const { areaId } = req.body;
  await db.areas.remove(areaId, req.user.organisationId);
  return res.sendStatus(200);
}

module.exports = {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
