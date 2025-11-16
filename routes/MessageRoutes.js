import express from 'express';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import Payment from '../models/pendingPayment.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Initialize Twilio client with error handling
let twilioClient = null;
if(true) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.warn('Twilio initialization failed:', error.message);
  }
}

// Initialize email transporter with error handling
let emailTransporter = null;
if (true) {
  try {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "bhaskarbabucm6@gmail.com",
        pass: "btejabsqqzymnako"
      }
    });
  } catch (error) {
    console.warn('Email transporter initialization failed:', error.message);
  }
}

// Send single SMS
router.post('/sms/single', async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(500).json({ 
        message: 'SMS service not configured. Please check Twilio credentials.' 
      });
    }

    const { phone, message, userId } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let phoneNumber = phone;
    let userName = 'User';

    // If userId is provided, get user details
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      phoneNumber = user.phone;
      userName = user.name;
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    res.json({
      message: `SMS sent successfully to ${userName}`,
      phone: phoneNumber,
      sid: result.sid,
      status: 'sent'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send single email
router.post('/email/single', async (req, res) => {
  try {
    const { email, subject, message, userId } = req.body;
    
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let emailAddress = email;
    let userName = 'User';

    // If userId is provided, get user details
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      emailAddress = user.email;
      userName = user.name;
    }

    if (!emailAddress) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    await emailTransporter.sendMail({
      from: "bhaskarbabucm6@gmail.com",
      to: emailAddress,
      subject: subject,
      html: `<p>${message}</p>`
    });

    res.json({
      message: `Email sent successfully to ${userName}`,
      email: emailAddress,
      status: 'sent'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send bulk SMS
router.post('/sms/bulk', async (req, res) => {
  try {
    const { message, recipients } = req.body;
    
    if (!message || !recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'Message and recipients are required' });
    }

    const results = [];
    const errors = [];

    for (const phone of recipients) {
      try {
        const result = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        results.push({ phone, sid: result.sid, status: 'sent' });
      } catch (error) {
        errors.push({ phone, error: error.message });
      }
    }

    res.json({
      message: `SMS sent to ${results.length} recipients`,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send bulk emails
router.post('/email/bulk', async (req, res) => {
  try {
    const { subject, message, recipients } = req.body;
    
    if (!subject || !message || !recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'Subject, message and recipients are required' });
    }

    const results = [];
    const errors = [];

    for (const email of recipients) {
      try {
        await emailTransporter.sendMail({
          from: "bhaskarbabucm6@gmail.com",
          to: email,
          subject: subject,
          html: message
        });
        results.push({ email, status: 'sent' });
      } catch (error) {
        errors.push({ email, error: error.message });
      }
    }

    res.json({
      message: `Email sent to ${results.length} recipients`,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send payment reminders
router.post('/payment-reminders', async (req, res) => {
  try {
    const { type, customMessage } = req.body; // type: 'sms' or 'email'
    
    if (type === 'sms' && !twilioClient) {
      return res.status(500).json({ 
        message: 'SMS service not configured. Please check Twilio credentials.' 
      });
    }

    if (type === 'email' && !emailTransporter) {
      return res.status(500).json({ 
        message: 'Email service not configured. Please check email credentials.' 
      });
    }

    const pendingPayments = await Payment.find({ status: 'pending' }).populate('userId');
    
    if (pendingPayments.length === 0) {
      return res.json({ message: 'No pending payments found' });
    }

    const results = [];
    const errors = [];

    for (const payment of pendingPayments) {
      try {
        const defaultMessage = `Dear ${payment.userId.name}, you have a pending payment of $${payment.amount} due on ${payment.dueDate.toDateString()}. Please make the payment at your earliest convenience.`;
        const messageToSend = customMessage || defaultMessage;

        if (type === 'sms') {
          const result = await twilioClient.messages.create({
            body: messageToSend,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: payment.phone
          });
          results.push({ phone: payment.phone, sid: result.sid, status: 'sent' });
        } else if (type === 'email') {
          await emailTransporter.sendMail({
            from: "bhaskarbabucm6@gmail.com",
            to: payment.email,
            subject: 'Payment Reminder',
            html: `<p>${messageToSend}</p>`
          });
          results.push({ email: payment.email, status: 'sent' });
        }
      } catch (error) {
        errors.push({ 
          recipient: type === 'sms' ? payment.phone : payment.email, 
          error: error.message 
        });
      }
    }

    res.json({
      message: `Payment reminders sent to ${results.length} recipients`,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;