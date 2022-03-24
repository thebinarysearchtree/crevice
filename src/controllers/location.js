import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';

const middleware = [auth, admin];

const wrap = true;
const locations = sql.locations;

const routes = [
  {
    sql: locations.insert,
    params,
    route: '/locations/insert',
    middleware
  },
  {
    sql: locations.update,
    params,
    route: '/locations/update',
    middleware
  },
  {
    sql: locations.getById,
    params,
    route: '/locations/getById',
    middleware,
    wrap
  },
  {
    sql: locations.getItems,
    params,
    route: '/locations/getSelectListItems',
    middleware,
    wrap
  },
  {
    sql: locations.find,
    params,
    route: '/locations/find',
    middleware,
    wrap
  },
  {
    sql: locations.remove,
    params,
    route: '/locations/remove',
    middleware
  }
];

add(routes);
