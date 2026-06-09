import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import User from "../models/User";

export const adminInterceptor = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
  const user = await User.findById((decoded as any).id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  (req as any).user = user;
  next();
};