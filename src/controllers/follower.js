import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';

const middleware = [auth, owner];
const followers = sql.followers;

const routes = [
  {
    sql: followers.insert,
    params,
    route: '/followers/insert',
    middleware
  },
  {
    sql: followers.find,
    params,
    route: '/followers/find',
    middleware,
    wrap: true
  },
  {
    sql: followers.remove,
    params,
    route: '/followers/remove',
    middleware
  }
];

add(routes);
