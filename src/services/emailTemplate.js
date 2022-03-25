import mailer from './email.js';
import { db } from '../database/db.js';
import sql from '../../sql.js';

const replaceFields = (placeholders, template) => {
  let { plaintext, html } = template;
  const pattern = /{.+?}/g;
  const replacer = (placeholder) => {
    const key = placeholder.slice(1, placeholder.length - 1);
    return placeholders[key];
  };
  plaintext = plaintext.replaceAll(pattern, replacer);
  html = html.replaceAll(pattern, replacer);

  return { plaintext, html };
}

const send = async (type, users, templateId, organisationId) => {
  let template;
  if (templateId) {
    template = await db.first(sql.emailTemplates.getById, [templateId, type, organisationId]);
  }
  else {
    template = await db.first(sql.emailTemplates.getDefault, [type, organisationId]);
  }
  const promises = [];
  for (const user of users) {
    const { email: to } = user;
    const subject = template.subject;
    const { plaintext, html } = replaceFields(user, template);
    const promise = mailer.send({
      to,
      subject,
      text: plaintext,
      html
    });
    promises.push(promise);
  }
  const results = await Promise.all(promises);
  return results.flatMap(r => r.rejected);
}

export default {
  send
};
