const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  name,
  fieldType
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into fields(
      name,
      field_type,
      field_number,
      organisation_id)
    select $1, $2, coalesce(max(field_number), 0) + 1, $3
    from fields
    where
      organisation_id = $3 and
      deleted_at is null
    returning id`, [name, fieldType, organisationId]);
  return result.rows[0].id;
}

const update = async (fieldId, name, organisationId, client = pool) => {
  const result = await client.query(`
    update fields
    set 
      name = $2
    where
      id = $1 and
      organisation_id = $4 and
      deleted_at is null`, [fieldId, name, organisationId]);
  return result;
}

const moveUp = async (fieldId, organisationId, client = pool) => {
  const result = await client.query(`
    with update_result as (
      update fields
      set field_number = field_number - 1
      where
        id = $1 and
        organisation_id = $2 and
        deleted_at is null and
        field_number > 1
      returning field_number)
    update fields
    set field_number = (select field_number + 1 from update_result)
    where
      id != $1 and
      organisation_id = $2 and
      deleted_at is null and
      field_number = (select field_number from update_result)`, [fieldId, organisationId]);
  return result;
}

const getById = async (fieldId, organisationId, client = pool) => {
  const result = await client.query(`
    select 
      f.*,
      json_agg(
        json_build_object(
          'id', i.id, 
          'name', i.name, 
          'itemNumber', i.item_number) order by i.item_number asc) as select_items
    from 
      fields f left join
      field_items i on i.field_id = f.id
    where
      f.id = $1 and
      f.organisation_id = $2 and
      i.deleted_at is null
    group by f.id`, [fieldId, organisationId]);
  return result.rows[0];
}

const getFilenameFields = async (organisationId, client = pool) => {
  const result = await client.query(`
    select name
    from fields
    where
      organisation_id = $1 and
      field_type in ('Short', 'Standard', 'Number') and
      deleted_at is null`, [organisationId]);
  return result.rows.map(f => f.name);
}

const getCsvFields = async (organisationId, client = pool) => {
  const result = await client.query(`
    select * from fields
    where 
      organisation_id = $1 and
      deleted_at is null and
      field_type in ('Short', 'Standard', 'Number', 'Select')`, [organisationId]);
  return result.rows;
}

const getAllFields = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      f.*,
      json_agg(json_build_object('id', i.id, 'name', i.name) order by i.item_number asc) as select_items
    from 
      fields f left join
      field_items i on i.field_id = f.id
    where 
      f.organisation_id = $1 and
      f.deleted_at is null and
      i.deleted_at is null
    group by f.id
    order by f.field_number asc`, [organisationId]);
  return result.rows;
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      id,
      name,
      field_type
    from fields
    where
      organisation_id = $1 and
      deleted_at is null
    order by field_number asc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
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
    where
      f.organisation_id = $1 and
      f.deleted_at is null and
      u.deleted_at is null
    group by f.id
    order by f.field_number asc`, [organisationId]);
  return result.rows;
}

const remove = async (fieldId, organisationId, client = pool) => {
  await client.query(`
    with update_result as (
      update fields
      set deleted_at = now()
      where
        id = $1 and
        organisation_id = $2 and
        deleted_at is null
      returning field_number)
    update fields
    set field_number = field_number - 1
    where
      organisation_id = $2 and
      deleted_at is null and
      field_number > (select field_number from update_result)`, [fieldId, organisationId]);
}

module.exports = {
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
