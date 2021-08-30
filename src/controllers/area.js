import areaRepository from '../repositories/area.js';

const db = {
  areas: areaRepository
};

const insert = async (req, res) => {
  const area = req.body;
  const result = await db.areas.insert(area, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const update = async (req, res) => {
  const area = req.body;
  const result = await db.areas.update(area, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const getById = async (req, res) => {
  const { areaId } = req.body;
  const area = await db.areas.getById(areaId, req.user.organisationId);
  return res.send(area);
}

const getWithLocation = async (req, res) => {
  const locations = await db.areas.getWithLocation(req.user.organisationId);
  return res.send(locations);
}

const getSelectListItems = async (req, res) => {
  const user = req.user;
  const selectListItems = await db.areas.getSelectListItems(user.isAdmin, user.id, user.organisationId);
  return res.send(selectListItems);
}

const find = async (req, res) => {
  const areas = await db.areas.find(req.user.organisationId);
  return res.send(areas);
}

const remove = async (req, res) => {
  const { areaId } = req.body;
  const result = await db.areas.remove(areaId, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

export {
  insert,
  update,
  getById,
  getWithLocation,
  getSelectListItems,
  find,
  remove
};
