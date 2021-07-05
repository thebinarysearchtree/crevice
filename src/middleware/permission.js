const admin = (req, res, next) => {
  if (req.user.isAdmin) {
    return next();
  }
  return res.sendStatus(401);
}

const owner = (req, res, next) => {
  const { userId } = req.body;
  if (req.user.id !== userId && !req.user.isAdmin) {
    return res.sendStatus(401);
  }
  return next();
}

module.exports = {
  admin,
  owner
};
