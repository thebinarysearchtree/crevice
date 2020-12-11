const emailTemplateRepository = require('../repositories/emailTemplate');

const db = {
  emailTemplates: emailTemplateRepository
};

const defaultTemplates = [
  {
    type: 'signup',
    subject: 'Welcome to Crevice',
    plaintext: `
      Hi {firstName}, 
      Click this link to finish the signup process: {url}`
  },
  {
    type: 'invite',
    subject: 'Welcome to Crevice',
    plaintext: `
      Hi {firstName}, you have been invited to join Crevice. 
      Click this link to finish the process: {url}`
  },
  {
    type: 'lostPassword',
    subject: 'Reset your password',
    plaintext: `
      Hi {firstName}, 
      Click this link to reset your password: {url}`
  }
];

const populate = async (organisationId, client) => {
  for (const defaultTemplate of defaultTemplates) {
    const {
      type,
      subject,
      plaintext
    } = defaultTemplate;
    await db.emailTemplates.insert({
      type,
      name: 'Default Template',
      subject,
      slate: [{
        type: 'paragraph',
        children: [{ text: plaintext }]
      }],
      html: `<p>${plaintext}</p>`,
      plaintext,
      isDefault: true
    }, organisationId, client);
  }
}

module.exports = populate;
