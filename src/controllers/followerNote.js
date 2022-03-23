import auth from '../middleware/authentication.js';
import sql from '../../sql.js';
import { add, rowCount, params, userId } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';

const middleware = [auth, owner];

const routes = [
  {
    sql: sql.followerNotes.insert,
    params: userId,
    response: rowCount,
    route: '/followerNotes/insert',
    middleware
  },
  {
    sql: sql.followerNotes.remove,
    params,
    response: rowCount,
    route: '/followerNotes/remove',
    middleware
  }
];

add(routes);
