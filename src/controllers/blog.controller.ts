
import { Request, Response } from 'express';
import Blog from '../models/Blog';

export const createBlog = async (req: Request, res: Response) => {
  const blog = await Blog.create(req.body);
  res.status(201).json(blog);
};

export const getBlogs = async (_req: Request, res: Response) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
};
