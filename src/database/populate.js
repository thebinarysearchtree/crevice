import db from '../utils/db.js';
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

const populate = async (organisationId, client) => {
  for (const defaultTemplate of defaultTemplates) {
    const {
      type,
      subject,
      plaintext
    } = defaultTemplate;
    const query = sql.emailTemplates.insert;
    const params = [
      type,
      'Default Template',
      subject,
      JSON.stringify([{
        type: 'paragraph',
        children: [{ text: plaintext }]
      }]),
      `<p>${plaintext}</p>`,
      plaintext,
      true,
      organisationId
    ];
    await db.empty(query, params, client);
  }
}

export default populate;
