import sql from '../../sql.js';

const defaultTemplates = [
  {
    type: 'SignUp',
    subject: 'Welcome to Crevice',
    plaintext: `
      Hi {firstName}, 
      Click this link to finish the signup process: {url}`
  },
  {
    type: 'Invite',
    subject: 'Welcome to Crevice',
    plaintext: `
      Hi {firstName}, you have been invited to join Crevice. 
      Click this link to finish the process: {url}`
  },
  {
    type: 'LostPassword',
    subject: 'Reset your password',
    plaintext: `
      Hi {firstName}, 
      Click this link to reset your password: {url}`
  }
];

const populate = async (organisationId, db) => {
  for (const defaultTemplate of defaultTemplates) {
    const {
      type,
      subject,
      plaintext
    } = defaultTemplate;
    await db.empty(sql.emailTemplates.insert, {
      type,
      name: 'Default Template',
      subject,
      slate: JSON.stringify([{
        type: 'paragraph',
        children: [{ text: plaintext }]
      }]),
      html: `<p>${plaintext}</p>`,
      plaintext,
      isDefault: true,
      organisationId
    });
  }
}

export default populate;
