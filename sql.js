import { readdir, readFile } from 'fs/promises';

const sql = {};

const root = './src/sql';
const folders = await readdir(root);
for (const folder of folders) {
  const table = folder.endsWith('s') ? folder : folder + 's';
  sql[table] = {};
  const path = `${root}/${folder}`;
  const filenames = await readdir(path);
  for (const filename of filenames) {
    const query = filename.split('.')[0];
    const text = await readFile(`${path}/${filename}`, { encoding: 'utf8' });
    sql[table][query] = text;
  }
}

export default sql;
