import { Router } from 'express';
import { pool as client } from '../database/db.js';

const wrapSql = (sql) => {
  return `
    with wrap_result as (${sql}) 
    select cast(coalesce(json_agg(wrap_result), json_build_array()) as text) as result 
    from wrap_result`;
}

const wrapHandler = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

const add = (handlers) => {
  for (const config of handlers) {
    const { sql, params, response, route, middleware = [], wrap = false } = config;
    const handler = config.handler ? config.handler : async (req, res) => {
      const text = wrap ? wrapSql(sql) : sql;
      const values = params ? Object.values(params(req)) : null;
      const result = await client.query(text, values);
      if (wrap) {
        return res.send(result.rows[0].result);
      }
      if (!wrap && !response) {
        return res.json({ rowCount: result.rowCount });
      }
      return response(res, result);
    }
    router.post(route, middleware, wrapHandler(handler));
  }
}

const rowCount = (res, result) => res.json({ rowCount: result.rowCount });
const text = (res, result) => res.send(result.rows[0].result);
const params = (req) => ({...req.body, organisationId: req.user.organisationId });
const userId = (req) => ({...req.body, userId: req.user.id, organisationId: req.user.organisationId });

export {
  add,
  rowCount,
  text,
  params,
  userId,
  router
};
