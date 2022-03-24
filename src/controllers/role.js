import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';

const middleware = [auth, admin];

const wrap = true;
const roles = sql.roles;

const routes = [
  {
    sql: roles.insert,
    params,
    route: '/roles/insert',
    middleware
  },
  {
    sql: roles.update,
    params,
    route: '/roles/update',
    middleware
  },
  {
    sql: roles.getById,
    params,
    route: '/roles/getById',
    middleware,
    wrap
  },
  {
    sql: roles.getItems,
    params,
    route: '/roles/getSelectListItems',
    middleware,
    wrap
  },
  {
    sql: roles.find,
    params,
    route: '/roles/find',
    middleware,
    wrap
  },
  {
    sql: roles.remove,
    params,
    route: '/roles/remove',
    middleware
  }
];

add(routes);
