import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, rowCount, text, params } from '../utils/handler.js';

const middleware = [auth, admin];

const routes = [
  {
    sql: sql.roles.insert,
    params,
    response: rowCount,
    route: '/roles/insert',
    middleware
  },
  {
    sql: sql.roles.update,
    params,
    response: rowCount,
    route: '/roles/update',
    middleware
  },
  {
    sql: sql.roles.getById,
    params,
    response: text,
    route: '/roles/getById',
    middleware
  },
  {
    sql: sql.roles.getItems,
    params,
    response: text,
    route: '/roles/getSelectListItems',
    middleware
  },
  {
    sql: sql.roles.find,
    params,
    response: text,
    route: '/roles/find',
    middleware
  },
  {
    sql: sql.roles.remove,
    params,
    response: rowCount,
    route: '/roles/remove',
    middleware
  }
];

add(routes);
