const admin = (req, res, next) => {
  if (req.user.isAdmin) {
    return next();
  }
  return res.sendStatus(401);
}

module.exports = {
  admin
};
