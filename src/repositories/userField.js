import pool from '../database/db.js';
import sql from '../../sql.js';

const { userFields } = sql;

const insert = async ({
  fieldId,
  itemId,
  textValue,
  dateValue
}, userId, organisationId, client = pool) => {
  if (!itemId && !textValue && !dateValue) {
    throw new Error();
  }
  const text = userFields.insert;
  const values = [
    userId, 
    fieldId, 
    itemId, 
    textValue, 
    dateValue, 
    organisationId];
  const result = await client.query(text, values);
  return result.rowCount;
}

export default {
  insert
};
