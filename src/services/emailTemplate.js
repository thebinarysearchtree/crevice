const mailer = require('./email');
const emailTemplateRepository = require('../repositories/emailTemplate');

const db = {
  emailTemplates: emailTemplateRepository
};

const replaceFields = (placeholders, template) => {
  const { plaintext, html } = template;
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
    template = await db.emailTemplates.getById(templateId, type, organisationId);
  }
  else {
    template = await db.emailTemplates.getDefaultTemplate(type, organisationId);
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

module.exports = {
  send
};
