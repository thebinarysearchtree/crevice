import { readdir, readFile } from 'fs/promises';

const sql = {};

const wrap = (sql) => {
  return `
    with wrap_result as (${sql}) 
    select cast(coalesce(json_agg(wrap_result), json_build_array()) as text) as result 
    from wrap_result`;
}

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
      let query = await readFile(`${path}/${file}`, { encoding: 'utf8' });
      if (queryName.startsWith('get') || queryName.startsWith('find')) {
        query = wrap(query);
      }
      sql[name][queryName] = query;
    }
  }
}

await loadFiles();

export default sql;
