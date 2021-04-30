const mailer = require('nodemailer');
const { email, environment } = require('../../config');

let transport;
if (environment === 'test') {
  transport = {
    sendMail: (m) => {
      console.log(m);
      return [];
    }
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
    const info = await transport.sendMail(message);
    return info.rejected;
  }
  catch (e) {
    console.log(e);
  }
}

module.exports = { send };