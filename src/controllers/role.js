import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, rowCount, text, params } from '../utils/handler.js';

const middleware = [auth, admin];

const wrap = true;

const routes = [
  {
    sql: sql.roles.insert,
    params,
    route: '/roles/insert',
    middleware
  },
  {
    sql: sql.roles.update,
    params,
    route: '/roles/update',
    middleware
  },
  {
    sql: sql.roles.getById,
    params,
    route: '/roles/getById',
    middleware,
    wrap
  },
  {
    sql: sql.roles.getItems,
    params,
    route: '/roles/getSelectListItems',
    middleware,
    wrap
  },
  {
    sql: sql.roles.find,
    params,
    route: '/roles/find',
    middleware,
    wrap
  },
  {
    sql: sql.roles.remove,
    params,
    route: '/roles/remove',
    middleware
  }
];

add(routes);
