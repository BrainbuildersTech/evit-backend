
import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import Contact from '../models/Contact';

export const submitContact = async (req: Request, res: Response) => {
  const contact = await Contact.create(req.body);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'New EVIT Contact Message',
    text: req.body.message
  });

  res.status(201).json(contact);
};
