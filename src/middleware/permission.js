const admin = (req, res, next) => {
  if (req.user.isAdmin) {
    return next();
  }
  return res.sendStatus(401);
}

const rolePermission = (permission, additional) => {
  return (req, res, next) => {
    if (req.user.isAdmin) {
      return next();
    }
    const hasPermission = req.user.roles.includes(permission);
    const hasAdditional = additional ? additional(req) : true;
    if (hasPermission && hasAdditional) {
      return next();
    }
    return res.sendStatus(401);
  }
}

const invite = rolePermission(r => r.canInviteUsers);
const changeImage = rolePermission(
  r => r.canChangeImage, 
  (req) => req.params.userId === req.user.id);

module.exports = {
  admin,
  invite,
  changeImage
};
