import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, rowCount, text, params } from '../utils/handler.js';

const middleware = [auth, admin];

const routes = [
  {
    sql: sql.locations.insert,
    params,
    response: rowCount,
    route: '/locations/insert',
    middleware
  },
  {
    sql: sql.locations.update,
    params,
    response: rowCount,
    route: '/locations/update',
    middleware
  },
  {
    sql: sql.locations.getById,
    params,
    response: text,
    route: '/locations/getById',
    middleware
  },
  {
    sql: sql.locations.getItems,
    params,
    response: text,
    route: '/locations/getSelectListItems',
    middleware
  },
  {
    sql: sql.locations.find,
    params,
    response: text,
    route: '/locations/find',
    middleware
  },
  {
    sql: sql.locations.remove,
    params,
    response: rowCount,
    route: '/locations/remove',
    middleware
  }
];

add(routes);
