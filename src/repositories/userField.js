const getPool = require('../database/db');
const { sql } = require('../utils/data');

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
  await client.query(sql`
    insert into user_fields(
      user_id,
      field_id,
      item_id,
      text_value,
      date_value,
      organisation_id)
    select ${[userId, fieldId, itemId, textValue, dateValue, organisationId]}
    ${itemId ? sql`
    where exists(
      select 1 from field_items 
      where
        id = ${itemId} and
        field_id = ${fieldId} and
        organisation_id = ${organisationId})` : sql``}`);
}

module.exports = {
  insert
};
