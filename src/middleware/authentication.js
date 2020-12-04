const jwt = require('jsonwebtoken');
const config = require('../../config');

const authentication = (req, res, next) => {
  try {
    const token = req.get('Authorization').split(' ')[1];
    const organisationId = req.baseUrl.slice(1);
    req.user = jwt.verify(token, config.key);
    if (req.user.organisationId !== organisationId) {
      return res.sendStatus(401);
    }
    return next();
  }
  catch (e) {
    return res.sendStatus(401);
  }
}

module.exports = authentication;