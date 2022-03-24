import auth from '../middleware/authentication.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';

const middleware = [auth, owner];

const routes = [
  {
    sql: sql.followers.insert,
    params,
    route: '/followers/insert',
    middleware
  },
  {
    sql: sql.followers.find,
    params,
    route: '/followers/find',
    middleware,
    wrap: true
  },
  {
    sql: sql.followers.remove,
    params,
    middleware
  }
];

add(routes);
