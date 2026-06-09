
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  res.json({ token, user });
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();

    res.status(201).json({ message: 'Admin user created successfully' });
    
  } catch (error) {
    console.log("Error creating admin user:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
