import { db } from '../database/db.js';
import { add } from '../utils/handler.js';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import { files, photos } from '../middleware/upload.js';

const uploadFiles = async (req, res) => {
  const promises = [];
  for (const file of req.files) {
    const params = [...Object.values(file), req.user.id, req.user.organisationId];
    const promise = db.empty(sql.files.insert, params);
    promises.push(promise);
  }
  await Promise.all(promises);
  return res.json(req.files);
}

const uploadPhotos = async (req, res) => {
  return res.json(req.files);
}

const routes = [
  {
    handler: uploadFiles,
    route: '/files/uploadFiles',
    middleware: [auth, admin, files]
  },
  {
    hander: uploadPhotos,
    route: '/files/uploadPhotos',
    middleware: [auth, admin, photos]
  }
];

add(routes);
