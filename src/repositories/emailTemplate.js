import getPool from '../database/db.js';

const pool = getPool();

const insert = async ({
  type,
  name,
  subject,
  slate,
  html,
  plaintext,
  isDefault = false
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into email_templates(
      type,
      name,
      subject,
      slate,
      html,
      plaintext,
      is_default,
      organisation_id)
    values($1, $2, $3, $4, $5, $6, $7, $8)
    returning id`, [
      type, 
      name, 
      subject, 
      JSON.stringify(slate), 
      html, 
      plaintext, 
      isDefault, 
      organisationId]);
  return result.rows[0].id;
}

const getById = async (templateId, type, organisationId, client = pool) => {
  const result = await client.query(`
    select
      subject,
      html,
      plaintext
    from email_templates
    where 
      id = $1 and
      type = $2 and
      organisation_id = $3`, [templateId, type, organisationId]);
  return result.rows[0];
}

const getDefaultTemplate = async (type, organisationId, client = pool) => {
  const result = await client.query(`
    select
      subject,
      html,
      plaintext
    from email_templates
    where
      type = $1 and
      organisation_id = $2 and
      is_default is true`, [type, organisationId]);
  return result.rows[0];
}

const update = async ({
  templateId,
  subject,
  slate,
  html,
  plaintext
}, organisationId, client = pool) => {
  await client.query(`
    update email_templates
    set
      subject = $2,
      slate = $3,
      html = $4,
      plaintext = $5
    where
      id = $1 and
      organisation_id = $6`, [templateId, subject, slate, html, plaintext, organisationId]);
}

const deleteById = async (templateId, organisationId, client = pool) => {
  await client.query(`
    delete from email_templates
    where
      id = $1 and
      organisation_id = $2`, [templateId, organisationId]);
}

export default {
  insert,
  getById,
  getDefaultTemplate,
  update,
  deleteById
};
