import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';

const middleware = [auth, admin];

const wrap = true;

const routes = [
  {
    sql: sql.locations.insert,
    params,
    route: '/locations/insert',
    middleware
  },
  {
    sql: sql.locations.update,
    params,
    route: '/locations/update',
    middleware
  },
  {
    sql: sql.locations.getById,
    params,
    route: '/locations/getById',
    middleware,
    wrap
  },
  {
    sql: sql.locations.getItems,
    params,
    route: '/locations/getSelectListItems',
    middleware,
    wrap
  },
  {
    sql: sql.locations.find,
    params,
    route: '/locations/find',
    middleware,
    wrap
  },
  {
    sql: sql.locations.remove,
    params,
    route: '/locations/remove',
    middleware
  }
];

add(routes);
