const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  fieldId,
  itemId,
  textValue,
  dateValue
}, userId, organisationId, client = pool) => {
  if (!itemId && !textValue && !dateValue) {
    throw new Error();
  }
  const where = itemId ? `where exists(
    select 1 from field_items 
    where
      id = $3 and
      field_id = $2 and
      organisation_id = $6)` : '';
  await client.query(`
    insert into user_fields(
      user_id,
      field_id,
      item_id,
      text_value,
      date_value,
      organisation_id)
    select $1, $2, $3, $4, $5, $6
    ${where}`, [userId, fieldId, itemId, textValue, dateValue, organisationId]);
}

module.exports = {
  insert
};
