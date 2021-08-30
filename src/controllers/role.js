import roleRepository from '../repositories/role.js';

const db = {
  roles: roleRepository
};

const insert = async (req, res) => {
  const role = req.body;
  const result = await db.roles.insert(role, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const update = async (req, res) => {
  const role = req.body;
  const result = await db.roles.update(role, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const getById = async (req, res) => {
  const { roleId } = req.body;
  const role = await db.roles.getById(roleId, req.user.organisationId);
  return res.send(role);
}

const getSelectListItems = async (req, res) => {
  const selectListItems = await db.roles.getSelectListItems(req.user.organisationId);
  return res.send(selectListItems);
}

const find = async (req, res) => {
  const roles = await db.roles.find(req.user.organisationId);
  return res.send(roles);
}

const remove = async (req, res) => {
  const { roleId } = req.body;
  const result = await db.roles.remove(roleId, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

export {
  insert,
  update,
  getById,
  getSelectListItems,
  find,
  remove
};
