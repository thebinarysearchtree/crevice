const formidable = require('formidable');
const fs = require('fs').promises;
const { upload: config } = require('../../config');
const path = require('path');
const uuid = require('uuid/v4');
const sharp = require('sharp');

const form = formidable({ multiples: true });

const getFiles = (req) => {
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
}

const files = async (req, res) => {
  const { uploadedFiles } = await getFiles(req);
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
}

const photos = async (req, res) => {
  const { uploadedFiles } = await getFiles(req);
  const storedFiles = [];
  for (const file of uploadedFiles) {
    const photo = sharp(file.path);
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
    await photo.toFile(filePath);
    await fs.unlink(file.path);
    storedFiles.push({
      fileId,
      filename: `${fileId}.jpg`,
      originalName: file.name
    });
  }
}