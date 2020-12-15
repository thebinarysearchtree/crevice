const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');
const formidable = require('formidable');

const form = formidable({ multiples: true });

const parse = (req) => {
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
}

const unzip = (filePath) => {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        return reject(err);
      }
      const files = [];
      zipFile.readEntry();
      zipFile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName)) {
          return reject(new Error('No folders allowed'));
        }
        zipFile.openReadStream(entry, (err, readStream) => {
          if (err) {
            return reject(err);
          }
          readStream.on('end', () => zipFile.readEntry());
          const entryPath = `${path.dirname(filePath)}/${entry.fileName}`;
          const file = fs.createWriteStream(entryPath);
          readStream.pipe(file);
          files.push({
            name: entry.fileName,
            path: entryPath
          });
        });
      });
      zipFile.on('close', () => {
        fs.unlink(filePath, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(files);
        });
      });
    });
  })
}

module.exports = {
  parse,
  unzip
};
