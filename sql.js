import { readdir, readFile } from 'fs/promises';

const sql = {};

const loadFiles = async () => {
  const dir = './src/sql';
  const folders = await readdir(dir);
  for (const folder of folders) {
    const name = folder.endsWith('s') ? folder : folder + 's';
    sql[name] = {};
    const path = `${dir}/${folder}`;
    const files = await readdir(path);
    for (const file of files) {
      const queryName = file.split('.')[0];
      const query = await readFile(`${path}/${file}`, { encoding: 'utf8' });
      sql[name][queryName] = query;
    }
  }
}

await loadFiles();

export default sql;
