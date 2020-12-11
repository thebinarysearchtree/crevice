const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  type,
  name,
  subject,
  slate,
  html,
  plaintext
}, organisationId, client = pool) => {
  const result = await client.query(`
    insert into emailTemplates(
      type,
      name,
      subject,
      slate,
      html,
      plaintext,
      organisationId)
    values($1, $2, $3, $4, $5, $6)
    returning id`, [type, name, subject, slate, html, plaintext, organisationId]);
  return result.rows[0][0];
}

const getById = async (templateId, type, organisationId, client = pool) => {
  const result = await client.query(`
    select
      subject,
      html,
      plaintext
    from emailTemplates
    where 
      id = $1 and
      type = $2 and
      organisationId = $3`, [templateId, type, organisationId]);
  return result.rows[0];
}

const getDefaultTemplate = async (type, organisationId, client = pool) => {
  const result = await client.query(`
    select
      subject,
      html,
      plaintext
    from emailTemplates
    where
      type = $1 and
      organisationId = $2 and
      isDefault is true`, [type, organisationId]);
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
    update emailTemplates
    set
      subject = $2,
      slate = $3,
      html = $4,
      plaintext = $5
    where
      id = $1 and
      organisationId = $6`, [templateId, subject, slate, html, plaintext, organisationId]);
}

const deleteById = async (templateId, organisationId, client = pool) => {
  await client.query(`
    delete from emailTemplates
    where
      id = $1 and
      organisationId = $2`, [templateId, organisationId]);
}

module.exports = {
  insert,
  getById,
  getDefaultTemplate,
  update,
  deleteById
};
