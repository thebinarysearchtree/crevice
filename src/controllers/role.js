const getPool = require('../database/db');
const roleRepository = require('../repositories/role');
const { resetFailedPasswordAttempts } = require('../repositories/user');

const db = {
  roles: roleRepository
};

const insert = async (req, res) => {
  const role = req.body;
  const roleId = await db.roles.insert(role, req.user.organisationId);
  return res.json({ roleId });
}

const update = async (req, res) => {
  const role = req.body;
  await db.roles.update(role, req.user.organisationId);
  return res.sendStatus(200);
}

const getById = async (req, res) => {
  const { roleId } = req.body;
  const role = await db.roles.getById(roleId, req.user.organisationId);
  return res.json({ role });
}

const find = async (req, res) => {
  const roles = await db.roles.find(req.user.organisationId);
  return res.json({ roles });
}

const remove = async (req, res) => {
  const { roleId } = req.body;
  await db.roles.remove(roleId, req.user.organisationId);
  return res.sendStatus(200);
}

module.exports = {
  insert,
  update,
  find,
  remove
};
