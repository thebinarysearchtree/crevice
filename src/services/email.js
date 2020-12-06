const mailer = require('nodemailer');
const { email } = require('../../config');

const send = async ({
  to,
  subject,
  text,
  html
}) => {
  const transport = mailer.createTransport({
    host: email.host,
    port: email.port,
    secure: false,
    auth: {
      user: email.username,
      pass: email.password
    }
  });
  const message = {
    from: email.from,
    to,
    subject,
    text,
    html
  };
  try {
    await transport.sendMail(message);
  }
  catch (e) {
    console.log(e);
  }
}

module.exports = { send };