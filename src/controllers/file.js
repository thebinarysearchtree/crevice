const fileRepository = require('../repositories/file');

const db = {
  files: fileRepository
};

const uploadFiles = async (req, res) => {
  const promises = [];
  for (const file of req.files) {
    const promise = db.files.insert(file, req.user.id, req.user.organisationId);
    promises.push(promise);
  }
  await Promise.all(promises);
  return res.json(req.files);
}

const uploadPhotos = async (req, res) => {
  return res.json(req.files);
}

module.exports = { 
  uploadFiles,
  uploadPhotos
};
