const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  groupId,
  name,
  fieldType,
  fieldNumber
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into fields(
      group_id,
      name,
      field_type,
      field_number,
      organisation_id)
    values($1, $2, $3, $4, $5)
    returning id`, [groupId, name, fieldType, fieldNumber, organisationId]);
  return result.rows[0].id;
}

const insertSelectItem = async ({
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

const insertGroup = async (name, organisationId, client = pool) => {
  const result = await client.query(`
    insert into field_groups(
      name, 
      organisation_id)
    values($1, $2)
    returning id`, [name, organisationId]);
  return result.rows[0].id;
}

const update = async ({
  id, 
  name,
 }, organisationId, client = pool) => {
  await client.query(`
    update fields
    set 
      name = $2
    where
      id = $1 and
      organisation_id = $4 and
      deleted_at is null`, [id, name, organisationId]);
}

const updateGroup = async ({
  id, 
  name,
 }, organisationId, client = pool) => {
  await client.query(`
    update field_groups
    set 
      name = $2
    where
      id = $1 and
      organisation_id = $4 and
      deleted_at is null`, [id, name, organisationId]);
}

const getById = async (fieldId, fieldType, organisationId, client = pool) => {
  const where = fieldType === 'Multiple fields' ? 'f.group_id = $1 and ' : 'f.id = $1 and ';
  const result = await client.query(`
    select 
      f.*,
      json_agg(json_build_object('id', i.id, 'name', i.name) order by i.item_number asc) as select_items
    from 
      fields f left join
      field_items i on i.field_id = f.id
    where
      ${where}
      f.organisation_id = $2
    group by f.id
    order by f.field_number asc`, [fieldId, organisationId]);
  return result.rows;
}

const getAllFields = async (organisationId, client = pool) => {
  const result = await client.query(`
    with field_result as (
      select 
        f.*,
        case when f.field_type = 'Date' then null else '' end as value,
        json_agg(json_build_object('id', i.id, 'name', i.name) order by i.item_number asc) as select_items
      from 
        fields f left join
        field_items i on i.field_id = f.id
      where 
        f.organisation_id = $1 and
        f.deleted_at is null
      group by f.id
      order by f.field_number asc)
    select
      f.group_id,
      json_agg(json_build_object(
        'id', f.id,
        'groupId', f.group_id,
        'name', f.name,
        'fieldType', f.field_type)) as fields
    from field_result f
    group by f.group_id`, [organisationId]);
  return result.rows.reduce((a, c) => {
    if (c.groupId) {
      return a.concat([c.fields]);
    }
    return a.concat(c.fields.map(f => [f]));
  }, []);
}

const getSelectListItems = async (organisationId, client = pool) => {
  const result = await client.query(`
    select 
      id,
      name,
      'Multiple fields' as field_type
    from field_groups
    where
      organisation_id = $1 and
      deleted_at is null
    union all
    select
      id,
      name,
      field_type
    from fields
    where
      organisation_id = $1 and
      deleted_at is null and
      group_id is null
    order by name asc`, [organisationId]);
  return result.rows;
}

const find = async (organisationId, client = pool) => {
  const result = await client.query(`
    select
      f.id,
      f.name,
      f.field_type,
      count(*) filter (where uf.id is not null) as user_count
    from
      fields f left join
      user_fields uf on uf.field_id = f.id left join
      users u on uf.user_id = u.id
    where
      f.organisation_id = $1 and
      f.deleted_at is null and
      f.group_id is null and
      u.deleted_at is null
    group by f.id
    union all
    select
      fg.id,
      fg.name,
      'Multiple fields' as field_type,
      count(distinct u.id) filter (where uf.id is not null) as user_count
    from
      field_groups fg join
      fields f on f.group_id = fg.id left join
      user_fields uf on uf.field_id = f.id left join
      users u on uf.user_id = u.id
    where
      fg.organisation_id = $1 and
      fg.deleted_at is null and
      f.deleted_at is null and
      u.deleted_at is null
    group by fg.id
    order by name asc`, [organisationId]);
  return result.rows;
}

const remove = async (fieldId, organisationId, client = pool) => {
  await client.query(`
    update fields
    set deleted_at = now()
    where
      id = $1 and
      organisation_id = $2 and
      deleted_at is null`, [fieldId, organisationId]);
}

const removeGroup = async (fieldGroupId, organisationId) => {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query(`
      update field_groups
      set deleted_at = now()
      where
        id = $1 and
        organisation_id = $2 and
        deleted_at is null`, [fieldGroupId, organisationId]);
    await client.query(`
      update fields
      set deleted_at = now()
      where
        group_id = $1 and
        organisation_id = $2 and
        deleted_at is null`, [fieldGroupId, organisationId]);
    await client.query('commit');
  }
  catch (e) {
    await client.query('rollback');
    throw e;
  }
  finally {
    client.release();
  }
}

module.exports = {
  insert,
  insertSelectItem,
  insertGroup,
  update,
  updateGroup,
  getById,
  getAllFields,
  getSelectListItems,
  find,
  remove,
  removeGroup
};
