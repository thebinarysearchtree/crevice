import auth from '../middleware/authentication.js';
import sql from '../../sql.js';
import { add, params, userId } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';

const middleware = [auth, owner];

const routes = [
  {
    sql: sql.followerNotes.insert,
    params: userId,
    route: '/followerNotes/insert',
    middleware
  },
  {
    sql: sql.followerNotes.remove,
    params,
    route: '/followerNotes/remove',
    middleware
  }
];

add(routes);
