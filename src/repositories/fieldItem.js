const getPool = require('../database/db');
const { sql } = require('../utils/data');

const pool = getPool();

const insert = async ({
  fieldId,
  name,
  itemNumber
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into field_items(
      field_id,
      name,
      item_number,
      organisation_id)
    values(${[fieldId, name, itemNumber, organisationId]})
    returning id`);
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
      name = ${name},
      item_number = ${itemNumber}
    where
      id = ${id} and
      organisation_id = ${organisationId}`);
  return result;
}

const remove = async (itemId, organisationId, client = pool) => {
  const result = await client.query(sql`
    delete from field_items
    where
      id = ${itemId} and
      organisation_id = ${organisationId}`);
  return result;
}

module.exports = {
  insert,
  update,
  remove
};
