import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, params, userId } from '../utils/handler.js';

const middleware = [auth, admin];

const wrap = true;

const routes = [
  {
    sql: sql.areas.insert,
    params,
    route: '/areas/insert',
    middleware
  },
  {
    sql: sql.areas.update,
    params,
    route: '/areas/update',
    middleware
  },
  {
    sql: sql.areas.getById,
    params,
    route: '/areas/getById',
    middleware,
    wrap
  },
  {
    sql: sql.areas.getWithLocation,
    params,
    route: '/areas/getWithLocation',
    middleware,
    wrap
  },
  {
    sql: sql.areas.getItems,
    params: userId,
    route: '/areas/getItems',
    middleware: [auth],
    wrap
  },
  {
    sql: sql.areas.getItemsAsAdmin,
    params,
    route: '/areas/getItemsAsAdmin',
    middleware,
    wrap
  },
  {
    sql: sql.areas.find,
    params,
    route: '/areas/find',
    middleware,
    wrap
  },
  {
    sql: sql.areas.remove,
    params,
    route: '/areas/find',
    middleware
  }
];

add(routes);
