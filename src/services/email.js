import { createTransport } from 'nodemailer';
import config from '../../config.js';

const { email, environment } = config;

let transport;
if (environment === 'test') {
  transport = {
    sendMail: (m) => {
      console.log(m);
      return { rejected: [] };
    }
  }
}
else {
  transport = createTransport({
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

export default { send };
