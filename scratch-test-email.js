import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ebifiri.ikolispiff.chsi@gmail.com',
    pass: 'pnbydbmmhmlfymjj'
  }
});

transporter.sendMail({
  from: 'ebifiri.ikolispiff.chsi@gmail.com',
  to: 'ebifiri.ikolispiff.chsi@gmail.com',
  subject: 'Test',
  text: 'Test Email'
}).then(() => console.log('Successfully sent test email'))
  .catch(e => console.error('Error sending test email:', e));
