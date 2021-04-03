const fieldRepository = require('../repositories/field');

const db = {
  fields: fieldRepository
};

const insert = async (req, res) => {
  const field = req.body;
  const fieldId = await db.fields.insert(field, req.user.organisationId);
  return res.json({ fieldId });
}

const update = async (req, res) => {
  const field = req.body;
  await db.fields.update(field, req.user.organisationId);
  return res.sendStatus(200);
}

const getById = async (req, res) => {
  const { fieldId } = req.body;
  const field = await db.fields.getById(fieldId, req.user.organisationId);
  return res.json(role);
}

const getSelectListItems = async (req, res) => {
  const selectListItems = await db.fields.getSelectListItems(req.user.organisationId);
  return res.json(selectListItems);
}

const find = async (req, res) => {
  const fields = await db.fields.find(req.user.organisationId);
  return res.json(fields);
}

const remove = async (req, res) => {
  const { fieldId } = req.body;
  await db.fields.remove(fieldId, req.user.organisationId);
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
