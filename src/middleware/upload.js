import { rename, unlink } from 'fs/promises';
import config from '../../config.js';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import { parse } from './file.js';

const { upload } = config;

const getFiles = async (req) => {
  let { files } = await parse(req);
  if (Array.isArray(files.files)) {
    files = files.files;
  }
  else {
    files = [files.files];
  }
  return files;
}

const files = async (req, res, next) => {
  const files = await getFiles(req);
  const storedFiles = [];
  for (const file of files) {
    const fileId = uuid();
    const extension = extname(file.name);
    const filePath = `${upload.filesDir}/${fileId}${extension}`;
    await rename(file.path, filePath);
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
  const files = await getFiles(req);
  const storedFiles = [];
  for (const file of files) {
    let photo;
    try {
      photo = sharp(file.path);
    }
    catch (e) {
      storedFiles.push({
        originalName: file.name,
        error: `Could not open file`
      });
      continue;
    }
    const { width, height, format } = photo.metadata();
    const fileId = uuid();
    const filePath = `${upload.photosDir}/${fileId}.jpg`;
    if (width < photoSize || height < photoSize) {
      storedFiles.push({
        originalName: file.name,
        error: `Photo must be at least ${photoSize} x ${photoSize} pixels`
      });
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
    await unlink(file.path);
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

export {
  files,
  photos
};
