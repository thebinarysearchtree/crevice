const fs = require('fs').promises;
const { upload: config } = require('../../config');
const path = require('path');
const { v4: uuid } = require('uuid');
const sharp = require('sharp');
const { parse, unzip } = require('./file');

const files = async (req, res, next) => {
  const { uploadedFiles } = await parse(req);
  const storedFiles = [];
  for (const file of uploadedFiles) {
    const fileId = uuid();
    const extension = path.extname(file.name);
    const filePath = `${config.filesDir}/${fileId}${extension}`;
    await fs.rename(file.path, filePath);
    storedFiles.push({
      fileId,
      filename: `${fileId}${extension}`,
      originalName: file.name,
      sizeBytes: file.size,
      mimeType: file.type
    });
  }
  req.files = storedFiles;
  return next();
}

const photos = async (req, res, next) => {
  let { uploadedFiles } = await parse(req);
  if (uploadedFiles.length === 1 && path.extname(uploadedFiles[0].name) === 'zip') {
    uploadedFiles = await unzip(uploadedFiles[0].path);
  }
  const storedFiles = [];
  for (const file of uploadedFiles) {
    let photo;
    try {
      photo = sharp(file.path);
    }
    catch (e) {
      continue;
    }
    const { width, height, format } = photo.metadata();
    const fileId = uuid();
    const filePath = `${config.photosDir}/${fileId}.jpg`;
    if (width < 170 || height < 170) {
      continue;
    }
    if (width > height) {
      const left = Math.floor((width - height) / 2);
      photo.extract({ left, top: 0, width: height });
    }
    if (height > width) {
      photo.extract({ left: 0, top: 0, height: width });
    }
    if (width !== 170 && height !== 170) {
      photo.resize({ width: 170 });
    }
    if (format !== 'jpeg') {
      photo.toFormat('jpeg');
    }
    const result = await photo.toFile(filePath);
    await fs.unlink(file.path);
    storedFiles.push({
      fileId,
      filename: `${fileId}.jpg`,
      originalName: file.name,
      sizeBytes: result.size,
      mimeType: 'image/jpeg'
    });
  }
  req.files = storedFiles;
  return next();
}

module.exports = {
  files,
  photos
};
