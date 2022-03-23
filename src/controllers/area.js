import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, rowCount, text, params, userId } from '../utils/handler.js';

const middleware = [auth, admin];

const routes = [
  {
    sql: sql.areas.insert,
    params,
    response: rowCount,
    route: '/areas/insert',
    middleware
  },
  {
    sql: sql.areas.update,
    params,
    response: rowCount,
    route: '/areas/update',
    middleware
  },
  {
    sql: sql.areas.getById,
    params,
    response: text,
    route: '/areas/getById',
    middleware
  },
  {
    sql: sql.areas.getWithLocation,
    params,
    response: text,
    route: '/areas/getWithLocation',
    middleware
  },
  {
    sql: sql.areas.getItems,
    params: userId,
    response: text,
    route: '/areas/getItems',
    middleware: [auth]
  },
  {
    sql: sql.areas.getItemsAsAdmin,
    params,
    response: text,
    route: '/areas/getItemsAsAdmin',
    middleware
  },
  {
    sql: sql.areas.find,
    params,
    response: text,
    route: '/areas/find',
    middleware
  },
  {
    sql: sql.areas.remove,
    params,
    response: rowCount,
    route: '/areas/find',
    middleware
  }
];

add(routes);
