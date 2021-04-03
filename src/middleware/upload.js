const fs = require('fs').promises;
const { upload: config } = require('../../config');
const path = require('path');
const { v4: uuid } = require('uuid');
const sharp = require('sharp');
const { parse, unzip } = require('./file');
const parseCSV = require('csv-parse');

const csv = async (req, res, next) => {
  const { files } = await parse(req);
  const file = files.csv;
  const parsedFile = [];
  const parser = parseCSV();
  parser.on('readable', () => {
    let record;
    while (record = parser.read()) {
      parsedFiles.push(record);
    }
  });
  parser.on('error', (err) => {
    console.log(err);
  });
  parser.write(file);
  parser.end();
  req.csv = parsedFile;
}

const files = async (req, res, next) => {
  const { files } = await parse(req);
  if (Array.isArray(files.files)) {
    files = files.files;
  }
  else {
    files = [files.files];
  }
  const storedFiles = [];
  for (const file of files) {
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
  const photoSize = 320;
  let { files } = await parse(req);
  if (Array.isArray(files.photos)) {
    files = files.photos;
  }
  else {
    files = [files.photos];
  }
  if (files.length === 1 && path.extname(files[0].name) === 'zip') {
    files = await unzip(files[0].path);
  }
  const storedFiles = [];
  for (const file of files) {
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
    if (width < photoSize || height < photoSize) {
      continue;
    }
    if (width > height) {
      const left = Math.floor((width - height) / 2);
      photo.extract({ left, top: 0, width: height });
    }
    if (height > width) {
      photo.extract({ left: 0, top: 0, height: width });
    }
    if (width !== photoSize && height !== photoSize) {
      photo.resize({ width: photoSize });
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
  csv,
  files,
  photos
};
