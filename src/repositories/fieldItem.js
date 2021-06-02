const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  fieldId,
  name,
  itemNumber
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into field_items(
      field_id,
      name,
      item_number,
      organisation_id)
    values($1, $2, $3, $4)
    returning id`, [fieldId, name, itemNumber, organisationId]);
  return result.rows[0].id;
}

const update = async ({
  id,
  name,
  itemNumber
}, organisationId, client = pool) => {
  const result = await client.query(`
    update field_items
    set
      name = $2,
      item_number = $3
    where
      id = $1 and
      organisation_id = $4`, [id, name, itemNumber, organisationId]);
  return result;
}

const remove = async (itemId, organisationId, client = pool) => {
  const result = await client.query(`
    delete from field_items
    where
      id = $1 and
      organisation_id = $2`, [itemId, organisationId]);
  return result;
}

module.exports = {
  insert,
  update,
  remove
};
