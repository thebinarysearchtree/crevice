const mailer = require('nodemailer');
const { email, environment } = require('../../config');

let transport;
if (environment === 'test') {
  transport = {
    sendMail: (m) => console.log(m)
  }
}
else {
  transport = mailer.createTransport({
    host: email.host,
    port: email.port,
    secure: false,
    auth: {
      user: email.username,
      pass: email.password
    }
  });
}

const send = async ({
  to,
  subject,
  text,
  html
}) => {
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