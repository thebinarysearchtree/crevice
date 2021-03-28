const uploadFiles = async (req, res) => {
  return res.json(req.files);
}

const uploadPhotos = async (req, res) => {
  return res.json(req.files);
}

module.exports = { 
  uploadFiles,
  uploadPhotos
};
