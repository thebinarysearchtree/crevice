const shiftRepository = require('../repositories/shift');

const db = {
  shifts: shiftRepository
};

const insert = async (req, res) => {
  const shift = req.body;
  const shiftId = await db.shifts.insert(shift, req.user.id, req.user.organisationId);
  return res.json({ shiftId });
}

const find = async (req, res) => {
  const query = req.body;
  const shifts = await db.shifts.find(query, req.user.organisationId);
  return res.json(shifts);
}

module.exports = {
  insert,
  find
};
