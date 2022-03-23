import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import sql from '../../sql.js';
import { add, rowCount, params } from '../utils/handler.js';

const routes = [
  {
    sql: sql.shiftSeries.remove,
    params,
    response: rowCount,
    route: '/shiftSeries/remove',
    middleware: [auth, admin]
  }
];

add(routes);
