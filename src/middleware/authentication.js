import jwt from 'jsonwebtoken';
import config from '../../config.js';

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

export default authentication;
