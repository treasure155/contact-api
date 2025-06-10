const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Contact = require('./models/Contact');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Error:', err));

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send Emails
async function sendEmails(contactData, type) {
  const { name, email, phone, message, product_name } = contactData;

  const adminSubject = type === 'seller'
    ? `New Seller Contact About ${product_name}`
    : `New General Contact`;

  const adminMessage = `
    <h3>New ${type === 'seller' ? 'Seller Contact' : 'General Inquiry'}</h3>
    ${product_name ? `<p><strong>Product:</strong> ${product_name}</p>` : ''}
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Message:</strong><br>${message}</p>
  `;

  // Send to Admin
  await transporter.sendMail({
    from: `"JimzStyle Contact" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: adminSubject,
    html: adminMessage
  });

  // Send Confirmation to User
  const userMessage = `
    <p>Dear ${name},</p>
    <p>Thanks for contacting JimzStyle${product_name ? ` about <strong>${product_name}</strong>` : ''}.</p>
    <p>We’ve received your message and will respond shortly.</p>
    <br><p>Best Regards,<br>JimzStyle Team</p>
  `;

  await transporter.sendMail({
    from: `"JimzStyle" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your Message was Received`,
    html: userMessage
  });
}

// General Contact Endpoint
app.post('/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const contact = new Contact({ type: 'general', name, email, phone, message });

  try {
    await contact.save();
    await sendEmails(contact, 'general');
    res.status(200).json({ success: true, message: 'General inquiry submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Seller Contact Endpoint
app.post('/contact-seller', async (req, res) => {
  const { name, email, phone, message, product_id, product_name } = req.body;

  if (!name || !email || !phone || !message || !product_id || !product_name) {
    return res.status(400).json({ success: false, message: 'All fields are required for seller contact.' });
  }

  const contact = new Contact({ type: 'seller', product_id, product_name, name, email, phone, message });

  try {
    await contact.save();
    await sendEmails(contact, 'seller');
    res.status(200).json({ success: true, message: 'Seller message sent successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
