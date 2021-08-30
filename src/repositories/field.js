import getPool from '../database/db.js';
import { sql, wrap, makeReviver } from '../utils/data.js';

const reviver = makeReviver();

const pool = getPool();

const insert = async ({
  name,
  fieldType
}, organisationId, client = pool) => {
  const result = await client.query(sql`
    insert into fields(
      name,
      field_type,
      field_number,
      organisation_id)
    select ${name}, ${fieldType}, coalesce(max(field_number), 0) + 1, ${organisationId}
    from fields
    where organisation_id = ${organisationId}
    returning id`);
  return { fieldId: result.rows[0].id, rowCount: result.rowCount };
}

const update = async (fieldId, name, organisationId, client = pool) => {
  const result = await client.query(sql`
    update fields
    set 
      name = ${name}
    where
      id = ${fieldId} and
      organisation_id = ${organisationId}`);
  return result;
}

const moveUp = async (fieldId, organisationId, client = pool) => {
  const result = await client.query(sql`
    with update_result as (
      update fields
      set field_number = field_number - 1
      where
        id = ${fieldId} and
        organisation_id = ${organisationId} and
        field_number > 1
      returning field_number)
    update fields
    set field_number = (select field_number + 1 from update_result)
    where
      id != ${fieldId} and
      organisation_id = ${organisationId} and
      field_number = (select field_number from update_result)`);
  return result;
}

const getById = async (fieldId, organisationId, client = pool) => {
  const result = await client.query(wrap`
    select 
      f.*,
      json_agg(
        json_build_object(
          'id', i.id, 
          'name', i.name, 
          'item_number', i.item_number) order by i.item_number asc) as select_items
    from 
      fields f left join
      field_items i on i.field_id = f.id
    where
      f.id = ${fieldId} and
      f.organisation_id = ${organisationId}
    group by f.id`);
  return result.rows[0].result;
}

const getFilenameFields = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select name
    from fields
    where
      organisation_id = ${organisationId} and
      field_type in ('Short', 'Standard', 'Number')`);
  return result.rows[0].result;
}

const getCsvFields = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select * from fields
    where 
      organisation_id = ${organisationId} and
      field_type in ('Short', 'Standard', 'Number', 'Select')`);
  return JSON.parse(result.rows[0].result, reviver);
}

const getAllFields = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select 
      f.*,
      json_agg(json_build_object('id', i.id, 'name', i.name) order by i.item_number asc) as select_items
    from 
      fields f left join
      field_items i on i.field_id = f.id
    where f.organisation_id = ${organisationId}
    group by f.id
    order by f.field_number asc`);
  return result.rows[0].result;
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(wrap`
    select
      id,
      name,
      field_type
    from fields
    where organisation_id = ${organisationId}
    order by field_number asc`);
  return result.rows[0].result;
}

const find = async (organisationId, client = pool) => {
  const itemsQuery = sql`
    select
      field_id,
      json_agg(json_build_object(
        'id', id,
        'name', name,
        'item_number', item_number) order by item_number asc) as select_items
    from field_items
    group by field_id`;
  
  const fieldsQuery = sql`
    select
      f.id,
      f.name,
      f.field_type,
      f.field_number,
      count(*) filter (where uf.id is not null) as user_count
    from
      fields f left join
      user_fields uf on uf.field_id = f.id left join
      users u on uf.user_id = u.id
    where f.organisation_id = ${organisationId}
    group by f.id
    order by f.field_number asc`;

  const result = await client.query(wrap`
    select
      f.*,
      coalesce(i.select_items, json_build_array()) as select_items
    from
      (${fieldsQuery}) as f left join
      (${itemsQuery}) as i on f.id = i.field_id
    order by f.field_number asc`);
  return result.rows[0].result;
}

const remove = async (fieldId, organisationId, client = pool) => {
  const result = await client.query(sql`
    with delete_result as (
      delete from fields
      where
        id = ${fieldId} and
        organisation_id = ${organisationId}
      returning field_number)
    update fields
    set field_number = field_number - 1
    where
      organisation_id = ${organisationId} and
      field_number > (select field_number from delete_result)`);
  return result;
}

export default {
  insert,
  update,
  moveUp,
  getById,
  getFilenameFields,
  getCsvFields,
  getAllFields,
  getSelectListItems,
  find,
  remove
};
