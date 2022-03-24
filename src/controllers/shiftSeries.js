import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, params } from '../utils/handler.js';

const routes = [
  {
    sql: sql.shiftSeries.remove,
    params,
    route: '/shiftSeries/remove',
    middleware: [auth, admin]
  }
];

add(routes);
