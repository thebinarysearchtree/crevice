const jwt = require('jsonwebtoken');
const config = require('../../config');

const authentication = (req, res, next) => {
  try {
    const token = req.get('Authorization').split(' ')[1];
    req.user = jwt.verify(token, config.key);
    return next();
  }
  catch (e) {
    return res.sendStatus(401);
  }
}

module.exports = authentication;