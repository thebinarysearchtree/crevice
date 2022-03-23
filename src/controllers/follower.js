import auth from '../middleware/authentication.js';
import sql from '../../sql.js';
import { add, rowCount, text, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';

const middleware = [auth, owner];

const routes = [
  {
    sql: sql.followers.insert,
    params,
    response: rowCount,
    route: '/followers/insert',
    middleware
  },
  {
    sql: sql.followers.find,
    params,
    response: text,
    route: '/followers/find',
    middleware
  },
  {
    sql: sql.followers.remove,
    params,
    response: rowCount,
    middleware
  }
];

add(routes);
