const fileRepository = require('../repositories/file');

const db = {
  files: fileRepository
};

const uploadFiles = async (req, res) => {
  for (const file of req.files) {
    await db.files.insert(file, req.user.id, req.user.organisationId);
  }
  return res.json(req.files);
}

const uploadPhotos = async (req, res) => {
  return res.json(req.files);
}

module.exports = { 
  uploadFiles,
  uploadPhotos
};
