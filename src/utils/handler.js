import { Router } from 'express';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

const add = (handlers) => {
  for (const config of handlers) {
    const { sql, params = [], response, route, middleware = [] } = config;
    const handler = config.handler ? config.handler : async (req, res) => {
      const result = await client.query(sql, params(req));
      return response(res, result);
    }
    router.post(route, middleware, wrap(handler));
  }
}

const rowCount = (res, result) => res.json({ rowCount: result.rowCount });
const text = (res, result) => res.send(result.rows[0].result);
const params = (req) => [...req.body ? Object.values(req.body) : [], req.user.organisationId];
const userId = (req) => [...req.body ? Object.values(req.body) : [], req.user.id, req.user.organisationId];

export {
  add,
  rowCount,
  text,
  params,
  userId
};
