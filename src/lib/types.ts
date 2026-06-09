import { Request } from 'express';

export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {}; 