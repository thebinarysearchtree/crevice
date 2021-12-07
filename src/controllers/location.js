import locationRepository from '../repositories/location.js';

const db = {
  locations: locationRepository
};

const insert = async (req, res) => {
  const location = req.body;
  const rowCount = await db.locations.insert(location, req.user.organisationId);
  return res.json({ rowCount});
}

const update = async (req, res) => {
  const location = req.body;
  const rowCount = await db.locations.update(location, req.user.organisationId);
  return res.json({ rowCount });
}

const getById = async (req, res) => {
  const { locationId } = req.body;
  const location = await db.locations.getById(locationId, req.user.organisationId);
  return res.send(location);
}

const getSelectListItems = async (req, res) => {
  const selectListItems = await db.locations.getSelectListItems(req.user.organisationId);
  return res.send(selectListItems);
}

const find = async (req, res) => {
  const locations = await db.locations.find(req.user.organisationId);
  return res.send(locations);
}

const remove = async (req, res) => {
  const { locationId } = req.body;
  const rowCount = await db.locations.remove(locationId, req.user.organisationId);
  return res.json({ rowCount });
}

export {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
